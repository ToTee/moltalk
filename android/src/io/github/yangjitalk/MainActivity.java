package io.github.yangjitalk;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 양지톡 안드로이드 껍데기.
 * 화면(app/)은 앱에 들어 있는 파일을 그대로 보여 주고, 디시로 가는 요청만 대신 보내 줍니다.
 * 쓰기·삭제·로그인은 디시 공식 모바일 화면을 보조 웹뷰에서 열어 처리합니다.
 */
public class MainActivity extends Activity {
    private static final String UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
    private static final String MOBILE_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
    private static final String APP_HOST = "app.yangjitalk.invalid";
    private static final String APP_URL = "https://" + APP_HOST + "/index.html";
    private static final int PICK_FILE = 1;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService pool = Executors.newFixedThreadPool(4);
    private WebView main;
    private WebView helper;
    private LinearLayout helperBox;
    private View helperDim;
    private TextView helperTitle;
    private ValueCallback<Uri[]> filePick;

    // 보조 웹뷰에서 진행 중인 작업 하나의 상태
    private String jobId;
    private boolean jobVisible;
    private String jobToken; // 작업마다 새로 만드는 표식. 공식 화면이 결과를 돌려줄 때 확인합니다.
    private boolean jobShown; // 숨겨서 진행하던 작업을 잠깐 보여 주는 중
    private String jobCloseOn;
    private String jobCode;
    private String jobInjectedUrl;
    private Runnable jobTimeout;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        main = new WebView(this);
        setup(main, UA);
        // 움직이는 디시콘은 소리 없는 영상이라, 누르지 않아도 재생되게 합니다(안 그러면 재생 버튼 그림만 보입니다).
        main.getSettings().setMediaPlaybackRequiresUserGesture(false);
        main.addJavascriptInterface(new Bridge(), "YJ");
        main.setWebViewClient(new MainClient());
        main.setWebChromeClient(new Chooser());
        root.addView(main, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        helperBox = new LinearLayout(this);
        helperBox.setOrientation(LinearLayout.VERTICAL);
        helperBox.setBackgroundColor(Color.WHITE);
        helperBox.setVisibility(View.GONE);
        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(24, 8, 8, 8);
        TextView title = helperTitle = new TextView(this);
        title.setText("디시인사이드");
        title.setTextSize(16);
        title.setTextColor(Color.BLACK);
        bar.addView(title,new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        Button close = new Button(this);
        close.setText("닫기");
        close.setOnClickListener(v -> finishJob(jobVisible ? "false" : CANCELLED));
        bar.addView(close);
        helperBox.addView(bar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        helper = new WebView(this);
        setup(helper, MOBILE_UA);
        helper.addJavascriptInterface(new HelperBridge(), "YJD");
        helper.setWebViewClient(new HelperClient());
        helper.setWebChromeClient(new Chooser());
        helperBox.addView(helper, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        // '사람인지 확인' 팝업 뒤를 어둡게 가리는 막
        helperDim = new View(this);
        helperDim.setBackgroundColor(0x99000000);
        helperDim.setClickable(true);
        helperDim.setVisibility(View.GONE);
        root.addView(helperDim, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(helperBox, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // 화면이 상태 표시줄, 내비게이션 바, 키보드에 가리지 않게 여백을 줍니다.
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets in = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                v.setPadding(in.left, in.top, in.right, in.bottom);
            } else {
                v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        setContentView(root);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(helper, true);
        main.loadUrl(APP_URL);
    }

    private void setup(WebView w, String userAgent) {
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setUserAgentString(userAgent);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSupportMultipleWindows(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    }

    private static boolean dcUrl(String url) {
        try {
            Uri u = Uri.parse(url);
            String h = u.getHost();
            return "https".equals(u.getScheme()) && u.getUserInfo() == null && h != null
                    && (h.equals("dcinside.com") || h.endsWith(".dcinside.com") || h.equals("dcinside.co.kr") || h.endsWith(".dcinside.co.kr"));
        } catch (Exception e) {
            return false;
        }
    }

    private void reply(String id, String json) {
        ui.post(() -> main.evaluateJavascript("window.__yjReply&&window.__yjReply(" + JSONObject.quote(id) + "," + json + ")", null));
    }

    private static String error(String message) {
        try {
            return new JSONObject().put("__error", message).toString();
        } catch (Exception e) {
            return "{\"__error\":\"오류\"}";
        }
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
        return out.toByteArray();
    }

    private static void storeCookies(String url, HttpURLConnection c) {
        List<String> cookies = c.getHeaderFields().get("Set-Cookie");
        if (cookies != null) for (String v : cookies) CookieManager.getInstance().setCookie(url, v);
    }

    /** 화면이 요청한 디시 주소를 대신 받아 옵니다. 쿠키는 웹뷰와 같은 저장소를 씁니다. */
    private String doHttp(String url, String optJson) throws Exception {
        JSONObject opt = new JSONObject(optJson == null || optJson.isEmpty() ? "{}" : optJson);
        boolean post = "POST".equals(opt.optString("method"));
        // 다른 주소로 넘기는 응답은 직접 따라가며, 디시 주소가 아니면 멈춥니다.
        for (int hop = 0; ; hop++) {
            String next = doHttpOnce(url, opt, post);
            if (!next.startsWith("redirect:")) return next;
            url = next.substring(9);
            post = false;
            if (hop >= 4 || !dcUrl(url)) throw new Exception("redirect");
        }
    }

    private String doHttpOnce(String url, JSONObject opt, boolean post) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        try {
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(10000);
            c.setReadTimeout(20000);
            c.setRequestProperty("User-Agent", UA);
            c.setRequestProperty("Referer", "https://gall.dcinside.com/");
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null) c.setRequestProperty("Cookie", cookie);
            JSONObject headers = opt.optJSONObject("headers");
            if (headers != null) for (Iterator<String> it = headers.keys(); it.hasNext(); ) {
                String k = it.next(), v = headers.optString(k);
                if (k.equalsIgnoreCase("referer")) { if (dcUrl(v)) c.setRequestProperty("Referer", v); }
                else if (k.equalsIgnoreCase("content-type") || k.equalsIgnoreCase("x-requested-with") || k.equalsIgnoreCase("accept")) c.setRequestProperty(k, v);
            }
            if (post) {
                c.setRequestMethod("POST");
                c.setDoOutput(true);
                try (OutputStream out = c.getOutputStream()) { out.write(opt.optString("body").getBytes(StandardCharsets.UTF_8)); }
            }
            int status = c.getResponseCode();
            storeCookies(url, c);
            String location = c.getHeaderField("Location");
            if (status >= 300 && status < 400 && location != null) return "redirect:" + new URL(new URL(url), location).toString();
            InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
            String text = in == null ? "" : new String(readAll(in), StandardCharsets.UTF_8);
            return new JSONObject().put("status", status).put("text", text).toString();
        } finally {
            c.disconnect();
        }
    }

    /** 화면에서 부르는 기능. 디시 주소가 아니면 거절합니다. */
    private class Bridge {
        @JavascriptInterface public String version() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }
        @JavascriptInterface public void http(String id, String url, String optJson) {
            if (!dcUrl(url)) { reply(id, error("디시인사이드 주소만 요청할 수 있습니다.")); return; }
            pool.execute(() -> {
                try { reply(id, doHttp(url, optJson)); }
                catch (Exception e) { reply(id, error("디시에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.")); }
            });
        }
        @JavascriptInterface public void drive(String id, String url, String code, String optJson) {
            ui.post(() -> startJob(id, url, code, false, null, optJson));
        }
        @JavascriptInterface public void official(String id, String url, String optJson) {
            ui.post(() -> startJob(id, url, null, true, optJson, optJson));
        }
        @JavascriptInterface public void open(String url) {
            // 글 속 링크는 기기의 브라우저로 엽니다. 웹 주소(http, https)만 허용합니다.
            Uri u = url == null ? null : Uri.parse(url);
            String scheme = u == null ? null : u.getScheme();
            if (u != null && u.getUserInfo() == null && ("https".equals(scheme) || "http".equals(scheme))) ui.post(() -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) { } });
        }
        @JavascriptInterface public void logout(String id) {
            ui.post(() -> CookieManager.getInstance().removeAllCookies(ok -> reply(id, "true")));
        }
    }

    /** 공식 화면 안의 조작 스크립트가 결과를 돌려줄 때 씁니다. */
    private class HelperBridge {
        @JavascriptInterface public void done(String id, String json) {
            // 공식 화면에서 온 글자는 그대로 코드에 붙이지 않고, 문자열로 감싼 뒤 화면 쪽에서 JSON으로만 해석합니다.
            String safe = "(()=>{try{return JSON.parse(" + JSONObject.quote(json == null ? "null" : json) + ")}catch(e){return {error:'응답을 해석하지 못했습니다.'}}})()";
            ui.post(() -> { if (id != null && id.equals(jobToken) && jobId != null && !jobVisible) finishJob(safe); });
        }
        /** '사람인지 확인'처럼 직접 눌러야 하는 일이 생기면 숨겨 둔 공식 화면을 잠깐 보여 줍니다. */
        @JavascriptInterface public void show(String token, boolean on) {
            ui.post(() -> {
                if (jobId == null || jobVisible || token == null || !token.equals(jobToken)) return;
                jobShown = on;
                popup(on);
                helperBox.setVisibility(on ? View.VISIBLE : View.INVISIBLE);
                if (jobTimeout != null) { ui.removeCallbacks(jobTimeout); ui.postDelayed(jobTimeout, on ? 200000 : 90000); }
            });
        }
    }

    private void startJob(String id, String url, String code, boolean visible, String closeOptJson, String optJson) {
        if (!dcUrl(url)) { reply(id, error("디시인사이드 주소만 열 수 있습니다.")); return; }
        if (jobId != null) { reply(id, "{\"error\":\"다른 작업이 진행 중입니다. 잠시 뒤에 다시 시도해 주세요.\"}"); return; }
        long timeout = 90000; // 화면 열기, 사람인지 확인(최대 20초), 등록 응답(최대 20초)을 모두 기다릴 수 있는 시간
        String closeOn = null;
        try {
            JSONObject opt = new JSONObject(optJson == null || optJson.isEmpty() ? "{}" : optJson);
            timeout = Math.min(Math.max(opt.optLong("timeout", 90000), 5000), 300000);
            if (visible && opt.has("closeOn")) closeOn = opt.optString("closeOn");
        } catch (Exception ignored) { }
        jobId = id;
        jobToken = java.util.UUID.randomUUID().toString();
        jobVisible = visible;
        jobCloseOn = closeOn;
        jobCode = code;
        jobInjectedUrl = null;
        helperBox.setVisibility(visible ? View.VISIBLE : View.INVISIBLE);
        if (!visible) {
            jobTimeout = () -> finishJob("{\"error\":\"시간이 초과되었습니다.\"}");
            ui.postDelayed(jobTimeout, timeout);
        }
        helper.loadUrl(url);
    }

    /** 공식 화면 상자를 화면 가운데의 작은 팝업으로 줄이거나(on), 전체 화면으로 되돌립니다. */
    private void popup(boolean on) {
        float d = getResources().getDisplayMetrics().density;
        FrameLayout.LayoutParams lp = on
            ? new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Math.round(250 * d), Gravity.CENTER)
            : new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        if (on) lp.setMargins(Math.round(16 * d), 0, Math.round(16 * d), 0);
        helperBox.setLayoutParams(lp);
        helperDim.setVisibility(on ? View.VISIBLE : View.GONE);
        helperTitle.setText(on ? "사람인지 확인" : "디시인사이드");
    }

    private static final String CANCELLED ="{\"error\":\"창을 닫아 등록을 취소했습니다.\"}";

    private void finishJob(String json) {
        if (jobId == null) return;
        String id = jobId;
        jobId = null;
        jobShown = false;
        popup(false);
        if (jobTimeout != null) { ui.removeCallbacks(jobTimeout); jobTimeout = null; }
        helperBox.setVisibility(View.GONE);
        helper.loadUrl("about:blank");
        reply(id, json);
    }

    private class HelperClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            // 화면 전체가 디시 밖으로 나가는 것만 막습니다. '사람인지 확인' 상자처럼 화면 안에 들어가는 틀은 그대로 둡니다.
            return request.isForMainFrame() && !dcUrl(request.getUrl().toString());
        }
        @Override public void onPageFinished(WebView view, String url) {
            if (jobId == null || url == null || url.startsWith("about:")) return;
            if (jobVisible) {
                if (jobCloseOn != null && url.startsWith(jobCloseOn)) ui.postDelayed(() -> finishJob("true"), 600);
                return;
            }
            if (jobInjectedUrl == null) {
                // 스크립트 결과(Promise)를 기다렸다가 YJD.done으로 돌려줍니다.
                jobInjectedUrl = url;
                // 결과를 돌려줄 때는 작업마다 새로 만든 표식을 함께 보내야 합니다. 화면 안에 끼워진 다른 사이트의 틀은 이 표식을 볼 수 없습니다.
                String id = JSONObject.quote(jobToken);
                view.evaluateJavascript("window.__yjShow=on=>YJD.show(" + id + ",!!on);(async()=>{try{const r=await (" + jobCode + ");YJD.done(" + id + ",JSON.stringify(r===undefined?null:r))}catch(e){YJD.done(" + id + ",JSON.stringify({error:'처리 중 오류가 났습니다: '+(e&&e.message||e)}))}})()", null);
            } else if (!url.equals(jobInjectedUrl)) {
                // 스크립트 실행 뒤 화면이 다른 주소로 넘어갔습니다(글 등록 완료 등).
                try { finishJob(new JSONObject().put("navigated", url).toString()); } catch (Exception e) { finishJob("{\"navigated\":\"\"}"); }
            }
        }
    }

    private class MainClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return true; // 화면은 다른 주소로 이동하지 않습니다.
        }
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (APP_HOST.equals(u.getHost())) return asset(u.getPath());
            if (!"GET".equals(request.getMethod()) || request.isForMainFrame() || !dcUrl(u.toString())) return null;
            return proxy(request);
        }
    }

    /** 앱에 들어 있는 화면 파일을 돌려줍니다. */
    private WebResourceResponse asset(String path) {
        String name = path == null ? "" : path.replaceFirst("^/+", "");
        if (!name.matches("[A-Za-z0-9._-]+")) return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<>(), null);
        String mime = name.endsWith(".html") ? "text/html" : name.endsWith(".css") ? "text/css" : name.endsWith(".js") ? "application/javascript" : name.endsWith(".png") ? "image/png" : "application/octet-stream";
        try {
            return new WebResourceResponse(mime, "utf-8", getAssets().open("app/" + name));
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<>(), null);
        }
    }

    /** 디시 사진·영상 서버는 Referer가 없으면 거절하므로, 화면이 요청한 사진을 Referer를 붙여 대신 받아 옵니다. */
    private WebResourceResponse proxy(WebResourceRequest request) {
        try {
            String url = request.getUrl().toString();
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(10000);
            c.setReadTimeout(30000);
            for (Map.Entry<String, String> h : request.getRequestHeaders().entrySet()) c.setRequestProperty(h.getKey(), h.getValue());
            c.setRequestProperty("User-Agent", UA);
            c.setRequestProperty("Referer", "https://gall.dcinside.com/");
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null) c.setRequestProperty("Cookie", cookie);
            int status = c.getResponseCode();
            if (status >= 300 && status < 400) return null;
            Map<String, String> headers = new HashMap<>();
            for (Map.Entry<String, List<String>> h : c.getHeaderFields().entrySet()) if (h.getKey() != null && !h.getValue().isEmpty()) headers.put(h.getKey(), h.getValue().get(0));
            headers.put("Access-Control-Allow-Origin", "*");
            String type = c.getContentType(), mime = type == null ? "application/octet-stream" : type.split(";")[0].trim();
            String reason = c.getResponseMessage();
            InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
            return new WebResourceResponse(mime, null, status, reason == null || reason.isEmpty() ? "OK" : reason, headers, in);
        } catch (Exception e) {
            return null;
        }
    }

    /** 사진·동영상 고르기 */
    private class Chooser extends WebChromeClient {
        @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (filePick != null) filePick.onReceiveValue(null);
            filePick = callback;
            try {
                Intent intent = params.createIntent();
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                startActivityForResult(intent, PICK_FILE);
                return true;
            } catch (Exception e) {
                filePick = null;
                return false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_FILE || filePick == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            ClipData clip = data.getClipData();
            if (clip != null && clip.getItemCount() > 0) {
                result = new Uri[clip.getItemCount()];
                for (int i = 0; i < result.length; i++) result[i] = clip.getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        filePick.onReceiveValue(result);
        filePick = null;
    }

    @Override
    public void onBackPressed() {
        if (jobId != null && jobVisible) {
            if (helper.canGoBack()) helper.goBack(); else finishJob("false");
            return;
        }
        if (jobId != null && jobShown) { finishJob(CANCELLED); return; }
        main.evaluateJavascript("!!(window.yjBack&&window.yjBack())", handled -> { if (!"true".equals(handled)) finish(); });
    }

    @Override
    protected void onDestroy() {
        pool.shutdownNow();
        main.destroy();
        helper.destroy();
        super.onDestroy();
    }
}
