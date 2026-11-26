package com.cottonledger.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintManager;
import android.webkit.*;
import android.widget.Toast;
import android.view.View;
import android.view.WindowInsets;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/** All assets are bundled; there is deliberately no INTERNET permission. */
public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingExport;
    private static final int IMPORT = 100, EXPORT = 101;
    private static final String HOST = "app.cottonledger.local";

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().setStatusBarColor(0xfff6f8f7);
        getWindow().setNavigationBarColor(0xfff6f8f7);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        web = new WebView(this);
        web.setBackgroundColor(0xfff6f8f7);
        web.setOnApplyWindowInsetsListener((v,insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        setContentView(web);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        web.addJavascriptInterface(new LocalBridge(), "Native");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri=request.getUrl();
                if (!HOST.equals(uri.getHost()) || !"https".equals(uri.getScheme())) return blocked();
                String path=uri.getPath();
                if(path==null||path.equals("/")) path="/index.html";
                if(path.contains("..")||path.contains("\\"))return blocked();
                String mime=path.endsWith(".mjs")||path.endsWith(".js")?"application/javascript":path.endsWith(".css")?"text/css":path.endsWith(".svg")?"image/svg+xml":path.endsWith(".webmanifest")?"application/manifest+json":"text/html";
                try {return new WebResourceResponse(mime,"UTF-8",200,"OK",Collections.singletonMap("Cache-Control","no-store"),getAssets().open(path.substring(1)));}
                catch(IOException e) {return blocked();}
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if(fileCallback!=null)fileCallback.onReceiveValue(null);
                fileCallback=callback;
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                try {startActivityForResult(intent,IMPORT);}catch(Exception e){callback.onReceiveValue(null);fileCallback=null;message("No file picker is available on this phone.");}
                return true;
            }
        });
        web.loadUrl("https://"+HOST+"/index.html");
    }
    private WebResourceResponse blocked() {return new WebResourceResponse("text/plain","UTF-8",404,"Not found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
    private void message(String text) {runOnUiThread(()->Toast.makeText(this,text,Toast.LENGTH_LONG).show());}
    public class LocalBridge {
        @JavascriptInterface public void exportFile(String text,String name,String mime) {
            if(text.length()>25*1024*1024){message("Backup is too large to export.");return;}
            runOnUiThread(()->{
                pendingExport=text;
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(mime.equals("text/csv")?"text/csv":"application/json");
                intent.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[^a-zA-Z0-9._-]","_"));
                try{startActivityForResult(intent,EXPORT);}catch(Exception e){pendingExport=null;message("Could not open the save dialog.");}
            });
        }
        @JavascriptInterface public void shareText(String text) {
            runOnUiThread(()->{Intent send=new Intent(Intent.ACTION_SEND);send.setType("text/plain");send.putExtra(Intent.EXTRA_TEXT,text);try{startActivity(Intent.createChooser(send,"Share product bill"));}catch(Exception e){message("No sharing app is available.");}});
        }
        @JavascriptInterface public void printBill() {
            runOnUiThread(()->{try{PrintManager manager=(PrintManager)getSystemService(PRINT_SERVICE);manager.print("Cotton Ledger bill",web.createPrintDocumentAdapter("Cotton Ledger bill"),null);}catch(Exception e){message("Printing is unavailable. You can share the bill instead.");}});
        }
    }
    @Override protected void onActivityResult(int request,int result,Intent data) {
        super.onActivityResult(request,result,data);
        if(request==IMPORT&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileCallback=null;}
        if(request==EXPORT){
            if(result==RESULT_OK&&data!=null&&data.getData()!=null&&pendingExport!=null){
                try(OutputStream output=getContentResolver().openOutputStream(data.getData())){if(output==null)throw new IOException();output.write(pendingExport.getBytes(StandardCharsets.UTF_8));message("File exported. Keep your backup somewhere safe.");}
                catch(Exception e){message("Could not write the file. Try another location.");}
            }
            pendingExport=null;
        }
    }
    @Override public void onBackPressed() {web.evaluateJavascript("window.nativeBack ? window.nativeBack() : false",value->{if(!"true".equals(value))finish();});}
    @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);web.removeJavascriptInterface("Native");web.destroy();super.onDestroy();}
}
