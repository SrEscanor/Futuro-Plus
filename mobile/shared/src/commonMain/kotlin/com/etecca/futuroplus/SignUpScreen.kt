package com.etecca.futuroplus

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import kotlinx.coroutines.launch

@Composable
fun SignUpScreen(onBackToLogin: () -> Unit, onSignUpSuccess: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var agreedToTerms by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val authRepository = remember { AuthRepository() }
    val scrollState = rememberScrollState()
    val focusManager = LocalFocusManager.current

    Box(modifier = Modifier.fillMaxSize().background(BackgroundWhite).pointerInput(Unit) {
        detectTapGestures(onTap = {
            focusManager.clearFocus()
        })
    }) {
        // Footer Waves Background
        Canvas(modifier = Modifier.fillMaxWidth().height(200.dp).align(Alignment.BottomCenter)) {
            val path = Path().apply {
                moveTo(0f, size.height * 0.5f)
                quadraticBezierTo(size.width * 0.25f, size.height * 0.3f, size.width * 0.5f, size.height * 0.5f)
                quadraticBezierTo(size.width * 0.75f, size.height * 0.7f, size.width, size.height * 0.5f)
                lineTo(size.width, size.height)
                lineTo(0f, size.height)
                close()
            }
            drawPath(path, color = BluePrimary.copy(alpha = 0.1f))
            
            val path2 = Path().apply {
                moveTo(0f, size.height * 0.7f)
                quadraticBezierTo(size.width * 0.3f, size.height * 0.6f, size.width * 0.6f, size.height * 0.8f)
                quadraticBezierTo(size.width * 0.85f, size.height * 0.9f, size.width, size.height * 0.75f)
                lineTo(size.width, size.height)
                lineTo(0f, size.height)
                close()
            }
            drawPath(path2, color = BluePrimary.copy(alpha = 0.8f))
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
        ) {
            // Header with Waves
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val path = Path().apply {
                        lineTo(0f, size.height * 0.75f)
                        quadraticBezierTo(size.width * 0.25f, size.height * 0.65f, size.width * 0.5f, size.height * 0.75f)
                        quadraticBezierTo(size.width * 0.75f, size.height * 0.85f, size.width, size.height * 0.75f)
                        lineTo(size.width, 0f)
                        close()
                    }
                    drawPath(path, color = BluePrimary.copy(alpha = 0.15f))

                    val path2 = Path().apply {
                        lineTo(0f, size.height * 0.65f)
                        quadraticBezierTo(size.width * 0.3f, size.height * 0.75f, size.width * 0.6f, size.height * 0.65f)
                        quadraticBezierTo(size.width * 0.85f, size.height * 0.55f, size.width, size.height * 0.65f)
                        lineTo(size.width, 0f)
                        close()
                    }
                    drawPath(path2, color = BluePrimary)
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(start = 24.dp, end = 24.dp, top = 60.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Top
                ) {
                    Text(
                        text = "Crie sua conta",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Passo 1 de 3 — Informações básicas",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 14.sp,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Progress Indicator
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(modifier = Modifier.size(width = 40.dp, height = 6.dp).background(OrangePrimary, RoundedCornerShape(3.dp)))
                        Box(modifier = Modifier.size(width = 40.dp, height = 6.dp).background(OrangePrimary.copy(alpha = 0.3f), RoundedCornerShape(3.dp)))
                        Box(modifier = Modifier.size(width = 40.dp, height = 6.dp).background(OrangePrimary.copy(alpha = 0.3f), RoundedCornerShape(3.dp)))
                    }
                }
            }

            Column(
                modifier = Modifier
                    .offset(y = (-80).dp)
                    .padding(horizontal = 24.dp)
                    .fillMaxWidth()
            ) {
                if (errorMessage != null) {
                    Text(
                        text = errorMessage!!,
                        color = Color.Red,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                // Nome Completo
                Text("Nome completo", fontWeight = FontWeight.Bold, color = TextBlack, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    placeholder = { Text("Seu nome", color = Color.Gray.copy(alpha = 0.5f)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = GrayLight,
                        unfocusedContainerColor = GrayLight,
                        unfocusedBorderColor = BorderGray,
                        focusedBorderColor = BluePrimary,
                        focusedTextColor = Color.Black,
                        unfocusedTextColor = Color.Black
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(20.dp))

                // E-mail
                Text("E-mail", fontWeight = FontWeight.Bold, color = TextBlack, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("seu@email.com", color = Color.Gray.copy(alpha = 0.5f)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = GrayLight,
                        unfocusedContainerColor = GrayLight,
                        unfocusedBorderColor = BorderGray,
                        focusedBorderColor = BluePrimary,
                        focusedTextColor = Color.Black,
                        unfocusedTextColor = Color.Black
                    ),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Senha e Confirmar lado a lado
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Senha", fontWeight = FontWeight.Bold, color = TextBlack, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            placeholder = { Text("••••••", color = Color.Gray.copy(alpha = 0.5f)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            visualTransformation = PasswordVisualTransformation(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = GrayLight,
                                unfocusedContainerColor = GrayLight,
                                unfocusedBorderColor = BorderGray,
                                focusedBorderColor = BluePrimary,
                                focusedTextColor = Color.Black,
                                unfocusedTextColor = Color.Black
                            ),
                            singleLine = true
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Confirmar", fontWeight = FontWeight.Bold, color = TextBlack, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = confirmPassword,
                            onValueChange = { confirmPassword = it },
                            placeholder = { Text("••••••", color = Color.Gray.copy(alpha = 0.5f)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            visualTransformation = PasswordVisualTransformation(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = GrayLight,
                                unfocusedContainerColor = GrayLight,
                                unfocusedBorderColor = BorderGray,
                                focusedBorderColor = BluePrimary,
                                focusedTextColor = Color.Black,
                                unfocusedTextColor = Color.Black
                            ),
                            singleLine = true
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Termos de uso Checkbox
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = agreedToTerms,
                        onCheckedChange = { agreedToTerms = it },
                        colors = CheckboxDefaults.colors(checkedColor = BluePrimary)
                    )
                    Text(
                        text = buildAnnotatedString {
                            append("Concordo com os ")
                            withStyle(style = SpanStyle(color = BluePrimary, fontWeight = FontWeight.Bold)) {
                                append("Termos de Uso")
                            }
                            append(" e ")
                            withStyle(style = SpanStyle(color = BluePrimary, fontWeight = FontWeight.Bold)) {
                                append("Política de Privacidade")
                            }
                        },
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Next Button
                Button(
                    onClick = {
                        if (email.isNotEmpty() && password.isNotEmpty() && password == confirmPassword && agreedToTerms) {
                            scope.launch {
                                isLoading = true
                                errorMessage = null
                                val result = authRepository.signUp(email, password)
                                isLoading = false
                                if (result.isSuccess) {
                                    onSignUpSuccess()
                                } else {
                                    errorMessage = result.exceptionOrNull()?.message ?: "Erro ao criar conta"
                                }
                            }
                        } else if (password != confirmPassword) {
                            errorMessage = "As senhas não coincidem"
                        } else if (!agreedToTerms) {
                            errorMessage = "Você precisa aceitar os termos"
                        }
                    },
                    enabled = !isLoading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BluePrimary),
                    shape = RoundedCornerShape(28.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Text("Próximo →", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Footer
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Já tem conta? ", color = Color.Gray)
                    TextButton(onClick = onBackToLogin) {
                        Text("Entrar", color = BluePrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Preview
@Composable
fun SignUpScreenPreview() {
    MaterialTheme {
        SignUpScreen(onBackToLogin = {}, onSignUpSuccess = {})
    }
}


