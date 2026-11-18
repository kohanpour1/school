package ir.boshra.school

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import ir.cafebazaar.poolakey.Connection
import ir.cafebazaar.poolakey.ConnectionState
import ir.cafebazaar.poolakey.Payment
import ir.cafebazaar.poolakey.config.PaymentConfiguration
import ir.cafebazaar.poolakey.config.SecurityCheck
import ir.cafebazaar.poolakey.request.PurchaseRequest

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private lateinit var payment: Payment
    private var paymentConnection: Connection? = null
    private var bazaarConnected = false

    companion object {
        // RSA public key from Cafe Bazaar developer panel (In-App Billing tab)
        private const val RSA_KEY =
            "MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwCkgBPahw+mOn25Y0MgFQKpHDYkDzxEEmd1zU3YKj2E2w+puFbyVm2eFVIZAXknQiaS0ubjQPEDzAIwIX/p/G6ZTabgsLp70Kzxs9eH1KBpt5tTlIH0HGpbtGV50WK3uQ+A0VOPCV+jzxkp4lAY7frlgbvoz6wjGt1gUxnYDQROlVbC71cmWtYXq1H3bpMUyS+LQvOvkDpP4K9SeANlZvI1Jfir3eFRdt/Qruvw4CcCAwEAAQ=="
        // One-time (non-consumable) SKU — create the same productId in Bazaar panel
        const val SKU_ADMIN_UNLOCK = "admin_unlock"
        private const val PREFS = "boshra_billing"
        private const val KEY_UNLOCKED = "admin_unlocked"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, true)
        webView = WebView(this)
        setContentView(webView)
        ViewCompat.setOnApplyWindowInsetsListener(webView) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
        }
        webView.addJavascriptInterface(BazaarBridge(), "BazaarBridge")
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                injectUnlockState()
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                }
                try {
                    @Suppress("DEPRECATION")
                    startActivityForResult(intent, 1001)
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    return false
                }
                return true
            }
        }

        setupPoolakey()
        webView.loadUrl("file:///android_asset/www/index.html")
    }

    private fun setupPoolakey() {
        val securityCheck = SecurityCheck.Enable(rsaPublicKey = RSA_KEY)
        val paymentConfig = PaymentConfiguration(localSecurityCheck = securityCheck)
        payment = Payment(context = this, config = paymentConfig)
        paymentConnection = payment.connect {
            connectionSucceed {
                bazaarConnected = true
                queryOwnedPurchases()
            }
            connectionFailed {
                bazaarConnected = false
            }
            disconnected {
                bazaarConnected = false
            }
        }
    }

    private fun queryOwnedPurchases() {
        payment.getPurchasedProducts {
            querySucceed { list ->
                val owned = list.any { it.productId == SKU_ADMIN_UNLOCK }
                if (owned) setUnlocked(true)
                injectUnlockState()
            }
            queryFailed {
                injectUnlockState()
            }
        }
    }

    private fun isUnlocked(): Boolean =
        getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean(KEY_UNLOCKED, false)

    private fun setUnlocked(v: Boolean) {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean(KEY_UNLOCKED, v).apply()
    }

    private fun injectUnlockState() {
        val unlocked = isUnlocked()
        val js = "window.__bazaarUnlocked=" + unlocked + ";" +
            "window.__bazaarConnected=" + bazaarConnected + ";" +
            "if(typeof window.onBazaarUnlock==='function'){try{window.onBazaarUnlock(" + unlocked + ");}catch(e){}}"
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }

    fun purchaseAdmin() {
        if (!bazaarConnected) {
            webView.post {
                webView.evaluateJavascript("if(typeof toast==='function')toast('بازار در دسترس نیست');", null)
            }
            return
        }
        if (isUnlocked()) {
            injectUnlockState()
            return
        }
        val request = PurchaseRequest(productId = SKU_ADMIN_UNLOCK)
        payment.purchaseProduct(activityResultRegistry, request) {
            purchaseSucceed {
                setUnlocked(true)
                injectUnlockState()
                webView.post {
                    webView.evaluateJavascript("if(typeof toast==='function')toast('خرید موفق — بخش ادمین باز شد');", null)
                }
            }
            purchaseCanceled {
                webView.post {
                    webView.evaluateJavascript("if(typeof toast==='function')toast('خرید لغو شد');", null)
                }
            }
            purchaseFailed {
                webView.post {
                    webView.evaluateJavascript("if(typeof toast==='function')toast('خطا در خرید');", null)
                }
            }
        }
    }

    inner class BazaarBridge {
        @JavascriptInterface
        fun isAdminUnlocked(): Boolean = isUnlocked()

        @JavascriptInterface
        fun isBazaarConnected(): Boolean = bazaarConnected

        @JavascriptInterface
        fun purchaseAdmin() {
            runOnUiThread { this@MainActivity.purchaseAdmin() }
        }

        @JavascriptInterface
        fun sku(): String = SKU_ADMIN_UNLOCK
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != 1001) return
        val result = if (resultCode == Activity.RESULT_OK && data != null) {
            WebChromeClient.FileChooserParams.parseResult(resultCode, data)
        } else null
        filePathCallback?.onReceiveValue(result)
        filePathCallback = null
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        paymentConnection?.disconnect()
        super.onDestroy()
    }
}
