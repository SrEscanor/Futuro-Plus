package com.etecca.futuroplus

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import androidx.compose.ui.tooling.preview.Preview
import futuroplus.shared.generated.resources.Res
import futuroplus.shared.generated.resources.ic_logo

@Composable
fun LoginScreen(onSignUpClick: () -> Unit, onLoginSuccess: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val authRepository = remember { AuthRepository() }
    val scrollState = rememberScrollState()
    val focusManager = LocalFocusManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BluePrimary)
            .pointerInput(Unit) {
                detectTapGestures(onTap = {
                    focusManager.clearFocus()
                })
            }
            .verticalScroll(scrollState)
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        // Logo Container
        Box(
            modifier = Modifier
                .size(140.dp)
                .clip(RoundedCornerShape(28.dp))
                .background(Color.White),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(Res.drawable.ic_logo),
                contentDescription = "Logo",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.FillBounds
            )
        }

        Spacer(modifier = Modifier.height(40.dp))

        Text(
            text = "Bem-vindo!",
            color = Color.White,
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = "Alcance seu potencial educacional",
            color = Color.White.copy(alpha = 0.9f),
            fontSize = 16.sp,
            modifier = Modifier.padding(top = 8.dp)
        )

        Spacer(modifier = Modifier.height(48.dp))

        if (errorMessage != null) {
            Surface(
                color = Color(0xFFFF5722).copy(alpha = 0.15f),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.padding(bottom = 24.dp)
            ) {
                Text(
                    text = errorMessage!!,
                    color = Color(0xFFFF5722),
                    fontSize = 14.sp,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    fontWeight = FontWeight.Bold
                )
            }
        }

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            placeholder = { Text("E-mail", color = Color.White.copy(alpha = 0.6f)) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color.White,
                unfocusedBorderColor = Color.White.copy(alpha = 0.6f),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                cursorColor = Color.White,
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
            ),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            placeholder = { Text("Senha", color = Color.White.copy(alpha = 0.6f)) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            trailingIcon = {
                TextButton(onClick = { passwordVisible = !passwordVisible }) {
                    Text(if (passwordVisible) "Esconder" else "Mostrar", color = Color.White, fontSize = 12.sp)
                }
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color.White,
                unfocusedBorderColor = Color.White.copy(alpha = 0.6f),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                cursorColor = Color.White,
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
            ),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = { /* TODO */ }) {
            Text("Esqueci minha senha", color = Color.White, fontSize = 14.sp)
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                if (email.isNotEmpty() && password.isNotEmpty()) {
                    scope.launch {
                        isLoading = true
                        errorMessage = null
                        val result = authRepository.signIn(email, password)
                        isLoading = false
                        if (result.isSuccess) {
                            onLoginSuccess()
                        } else {
                            val exception = result.exceptionOrNull()
                            errorMessage = when {
                                exception?.message?.contains("invalid-credential") == true || 
                                exception?.message?.contains("USER_NOT_FOUND") == true || 
                                exception?.message?.contains("WRONG_PASSWORD") == true ||
                                exception?.message?.contains("Error Domain=FIRAuthErrorDomain") == true -> {
                                    "Ops! Seu usuário e senha podem estar errados!"
                                }
                                exception?.message?.contains("invalid-email") == true -> {
                                    "Este formato de e-mail não parece válido."
                                }
                                exception?.message?.contains("network-request-failed") == true -> {
                                    "Problema de conexão. Verifique sua internet."
                                }
                                else -> "Ops! Algo deu errado. Tente novamente em instantes."
                            }
                        }
                    }
                }
            },
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.White),
            shape = RoundedCornerShape(28.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = BluePrimary, modifier = Modifier.size(24.dp))
            } else {
                Text(
                    text = "Login",
                    color = BluePrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(40.dp))

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(bottom = 32.dp)
        ) {
            Text("Ainda não possui uma conta?", color = Color.White.copy(alpha = 0.8f))
            TextButton(onClick = onSignUpClick) {
                Text("Cria conta", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Preview
@Composable
fun LoginScreenPreview() {
    MaterialTheme {
        LoginScreen(onSignUpClick = {}, onLoginSuccess = {})
    }
}



