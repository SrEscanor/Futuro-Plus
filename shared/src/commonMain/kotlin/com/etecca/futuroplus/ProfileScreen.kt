package com.etecca.futuroplus

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.tooling.preview.Preview
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(onNavigate: (String) -> Unit) {
    val scrollState = rememberScrollState()
    val scope = rememberCoroutineScope()
    val authRepository = remember { AuthRepository() }
    val currentUser = remember { authRepository.getCurrentUser() }
    val userName = currentUser?.displayName ?: "Usuário"
    val fullName = userName

    Box(modifier = Modifier.fillMaxSize().background(BackgroundWhite)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp)
        ) {
            Spacer(modifier = Modifier.height(48.dp))

            // Header Section
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, BorderGray)
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Perfil",
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = TextBlack
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Surface(
                                color = BluePrimary.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = "Editar",
                                    color = BluePrimary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Olá, $userName",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextBlack
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "👋", fontSize = 20.sp)
                        }

                        Text(
                            text = fullName,
                            fontSize = 14.sp,
                            color = Color.Gray
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = AppIcons.Educacao,
                                contentDescription = null,
                                tint = TextBlack,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Ciência de Dados 2ºSemestre",
                                fontSize = 14.sp,
                                color = TextBlack,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    // Profile Image Placeholder
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(GrayLight),
                        contentAlignment = Alignment.Center
                    ) {
                        // In a real app, use AsyncImage or similar
                        Text("👤", fontSize = 40.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Sobre mim",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TextBlack
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, BorderGray)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    ProfileInfoSection(
                        title = "Áreas de interesse",
                        content = {
                            Text(
                                text = "Tecnologia, Exatas, Linguagem",
                                fontSize = 14.sp,
                                color = Color.Gray
                            )
                        }
                    )

                    ProfileInfoSection(
                        title = "Carreira que quero seguir",
                        content = {
                            ProfileChip(text = "Cientista de Dados", isSelected = true)
                        }
                    )

                    ProfileInfoSection(
                        title = "Estilo de aprendizado",
                        content = {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                ProfileChip(text = "Aulas EAD", isSelected = true)
                                ProfileChip(text = "Leitura", isSelected = false)
                                ProfileChip(text = "Prática", isSelected = false)
                            }
                        }
                    )

                    ProfileInfoSection(
                        title = "Objetivos",
                        content = {
                            Text(
                                text = "Concluir minha graduação!",
                                fontSize = 14.sp,
                                color = Color.Gray
                            )
                        }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Progresso",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextBlack
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Progress Stats Row
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = Color.Transparent,
                        border = BorderStroke(1.dp, BorderGray.copy(alpha = 0.5f))
                    ) {
                        Row(
                            modifier = Modifier.height(IntrinsicSize.Min)
                        ) {
                            Column(
                                modifier = Modifier.weight(1f).padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("Pontuação", fontSize = 12.sp, color = Color.Gray)
                                Text(
                                    "875",
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = TextBlack
                                )
                            }
                            
                            // Divider
                            Box(modifier = Modifier.fillMaxHeight().width(1.dp).background(BorderGray.copy(alpha = 0.5f)))

                            Column(
                                modifier = Modifier.weight(1f).padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("Conquistas", fontSize = 12.sp, color = Color.Gray)
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    modifier = Modifier.padding(top = 4.dp)
                                ) {
                                    Text("🥇", fontSize = 20.sp)
                                    Text("🥈", fontSize = 20.sp)
                                    Text("🥉", fontSize = 20.sp)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Logout Button
            Button(
                onClick = {
                    scope.launch {
                        authRepository.signOut()
                        onNavigate("login")
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFFEEBEE),
                    contentColor = Color(0xFFD32F2F)
                ),
                shape = RoundedCornerShape(16.dp),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
            ) {
                Icon(
                    imageVector = AppIcons.Logout,
                    contentDescription = "Sair",
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "Sair da conta",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            Spacer(modifier = Modifier.height(120.dp))
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp)
        ) {
            BottomNavigationBar(currentScreen = "perfil", onNavigate = onNavigate)
        }
    }
}

@Composable
fun ProfileInfoSection(title: String, content: @Composable () -> Unit) {
    Column(modifier = Modifier.padding(bottom = 20.dp)) {
        Text(
            text = title,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = TextBlack
        )
        Spacer(modifier = Modifier.height(8.dp))
        content()
    }
}

@Composable
fun ProfileChip(text: String, isSelected: Boolean) {
    Surface(
        color = if (isSelected) BluePrimary else GrayLight,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = text,
            color = if (isSelected) Color.White else TextBlack,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

@Preview
@Composable
fun ProfileScreenPreview() {
    MaterialTheme {
        ProfileScreen(onNavigate = {})
    }
}
