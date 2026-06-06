package com.etecca.futuroplus

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.tooling.preview.Preview

@Composable
@Preview
fun App() {
    MaterialTheme {
        var currentScreen by remember { mutableStateOf("login") }

        when (currentScreen) {
            "login" -> LoginScreen(
                onSignUpClick = { currentScreen = "signup" },
                onLoginSuccess = { currentScreen = "main" }
            )
            "signup" -> SignUpScreen(
                onBackToLogin = { currentScreen = "login" },
                onSignUpSuccess = { currentScreen = "main" }
            )
            "main" -> MainScreen()
        }
    }
}
