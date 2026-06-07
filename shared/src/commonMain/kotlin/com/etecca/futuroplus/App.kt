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
                onLoginSuccess = { currentScreen = "home" }
            )
            "signup" -> SignUpScreen(
                onBackToLogin = { currentScreen = "login" },
                onSignUpSuccess = { currentScreen = "home" }
            )
            "home" -> MainScreen(onNavigate = { currentScreen = it })
            "cursos" -> CursosScreen(onNavigate = { currentScreen = it })
            "testes" -> TestsScreen(onNavigate = { currentScreen = it })
            "perfil" -> ProfileScreen(onNavigate = { currentScreen = it })
        }
    }
}
