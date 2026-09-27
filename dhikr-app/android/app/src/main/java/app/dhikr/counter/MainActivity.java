package app.dhikr.counter;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Last script published to the page, re-run on resume. See publishInsets. */
    private String insetScript = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Draw the web content edge-to-edge (behind the status/nav bars) so the
        // app background fills the whole screen instead of leaving a bare strip.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        watchSystemBarInsets();
    }

    @Override
    public void onResume() {
        super.onResume();
        // The values live in an inline style on <html>, so a WebView reload
        // would silently drop them and the rail would slide back under the
        // status bar. Insets rarely "change" on resume, so re-publish rather
        // than rely on the listener firing again.
        if (insetScript != null) {
            getBridge().getWebView().evaluateJavascript(insetScript, null);
        }
    }

    /**
     * Hand the real status/navigation bar insets to CSS as --sa-top/--sa-bottom.
     *
     * Because the window is edge-to-edge (see onCreate), the page runs underneath
     * the system bars and has to inset itself. It cannot discover those heights
     * on its own: Android WebView resolves env(safe-area-inset-*) from the
     * display *cutout* only, never from the status bar, so on a device with a
     * status bar and no cutout it reports 0 and the top-most nav icon ends up
     * under the bar, swallowing its own taps.
     *
     * Insets are dispatched when the view attaches, which is before the document
     * has loaded, so the injected script waits for &lt;html&gt; rather than
     * assuming it is already there.
     */
    private void watchSystemBarInsets() {
        final WebView webView = getBridge().getWebView();
        final float density = getResources().getDisplayMetrics().density;

        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> {
            final int bars = WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout();
            // Device px -> CSS px, which is what the WebView lays out in.
            final float top = insets.getInsets(bars).top / density;
            final float bottom = insets.getInsets(bars).bottom / density;

            insetScript =
                "(function(t,b){var i=0,w=setInterval(function(){"
              + "  var r=document.documentElement;"
              + "  if(!r){if(++i>200)clearInterval(w);return;}"
              + "  r.style.setProperty('--sa-top',t+'px');"
              + "  r.style.setProperty('--sa-bottom',b+'px');"
              + "  clearInterval(w);},25);})(" + top + "," + bottom + ")";
            webView.evaluateJavascript(insetScript, null);

            // Not consumed: the WebView still needs to see them.
            return insets;
        });

        ViewCompat.requestApplyInsets(webView);
    }
}
