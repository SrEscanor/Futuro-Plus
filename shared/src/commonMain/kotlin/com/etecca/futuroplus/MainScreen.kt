package com.etecca.futuroplus

import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.graphics.vector.ImageVector

@Composable
fun MainScreen(onNavigate: (String) -> Unit) {
    val scrollState = rememberScrollState()
    val authRepository = remember { AuthRepository() }
    val currentUser = remember { authRepository.getCurrentUser() }
    val userName = currentUser?.displayName ?: "Usuário"
    val initials = if (userName != "Usuário" && userName.isNotEmpty()) {
        userName.split(" ").filter { it.isNotEmpty() }.let {
            if (it.size >= 2) "${it[0][0]}${it[1][0]}".uppercase()
            else it[0].take(2).uppercase()
        }
    } else "US"

    Box(modifier = Modifier.fillMaxSize().background(BackgroundWhite)) {
        // Conteúdo que rola
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp)
        ) {
            Spacer(modifier = Modifier.height(24.dp))

            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Olá, $userName",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextBlack
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "👋", fontSize = 24.sp)
                    }
                    Text(
                        text = "Seu perfil está 75% completo",
                        fontSize = 14.sp,
                        color = Color.Gray
                    )
                }

                // Profile Initials Circle
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(BluePrimary.copy(alpha = 0.1f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = initials,
                        color = BluePrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Profile Progress Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BluePrimary)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp)
                ) {
                    Text(
                        text = "Progresso do perfil",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 14.sp
                    )
                    Text(
                        text = "75% completo",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )

                    LinearProgressIndicator(
                        progress = { 0.75f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(CircleShape),
                        color = Color.White,
                        trackColor = Color.White.copy(alpha = 0.2f)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { /* TODO */ },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 24.dp)
                    ) {
                        Text(
                            text = "Completar Perfil",
                            color = BluePrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Discovery Banner
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = GrayLight
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Descubra sua área ideal!",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = TextBlack
                        )
                        Text(
                            text = "Faça o teste de perfil",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                    Button(
                        onClick = { onNavigate("testes") },
                        colors = ButtonDefaults.buttonColors(containerColor = BluePrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Fazer teste", color = Color.White, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Last Result
            Text(
                text = "Último resultado: Tecnologia",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = TextBlack
            )
            Text(
                text = "Tendência para Tecnologia ℹ️",
                fontSize = 14.sp,
                color = Color.Gray,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Recommended Courses
            Text(
                text = "Cursos recomendados",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                color = TextBlack
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                CourseCard(
                    title = "Curso Técnico em Analise de Dados",
                    buttonText = "Ver todos os cursos",
                    icon = AppIcons.AnaliseDados,
                    iconColor = BluePrimary,
                    modifier = Modifier.weight(1f)
                )
                CourseCard(
                    title = "Marketing Digital para Iniciantes",
                    buttonText = "Explorar mais",
                    icon = AppIcons.Marketing,
                    iconColor = OrangePrimary,
                    modifier = Modifier.weight(1f)
                )
            }

            // Espaçamento extra no final para o conteúdo não ficar escondido atrás da barra
            Spacer(modifier = Modifier.height(120.dp))
        }

        // Barra fixa e flutuante posicionada na frente de tudo
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp) // Distância da base da tela
        ) {
            BottomNavigationBar(currentScreen = "home", onNavigate = onNavigate)
        }
    }
}

@Composable
fun CourseCard(
    title: String,
    buttonText: String,
    icon: ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.height(200.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, BorderGray),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(40.dp)
            )

            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                lineHeight = 18.sp,
                color = TextBlack
            )

            Button(
                onClick = { /* TODO */ },
                modifier = Modifier.fillMaxWidth().height(36.dp),
                colors = ButtonDefaults.buttonColors(containerColor = GrayLight),
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(0.dp)
            ) {
                Text(buttonText, fontSize = 12.sp, color = TextBlack, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
fun BottomNavigationBar(currentScreen: String, onNavigate: (String) -> Unit) {
    Surface(
        modifier = Modifier
            .padding(horizontal = 24.dp)
            .fillMaxWidth()
            .height(80.dp),
        shape = RoundedCornerShape(40.dp),
        color = BluePrimary,
        tonalElevation = 12.dp, // Sombra mais forte para parecer que está flutuando
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            FuturoNavigationItem(
                icon = AppIcons.Home,
                label = "Início",
                selected = currentScreen == "home",
                onClick = { onNavigate("home") }
            )
            FuturoNavigationItem(
                icon = AppIcons.Cursos,
                label = "Cursos",
                selected = currentScreen == "cursos",
                onClick = { onNavigate("cursos") }
            )
            FuturoNavigationItem(
                icon = AppIcons.Testes,
                label = "Testes",
                selected = currentScreen == "testes",
                onClick = { onNavigate("testes") }
            )
            FuturoNavigationItem(
                icon = AppIcons.Perfil,
                label = "Perfil",
                selected = currentScreen == "perfil",
                onClick = { onNavigate("perfil") }
            )
        }
    }
}

@Composable
fun RowScope.FuturoNavigationItem(
    icon: ImageVector,
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .weight(1f)
            .fillMaxHeight()
            .clip(CircleShape)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (selected) Color.White else Color.White.copy(alpha = 0.6f),
            modifier = Modifier.size(28.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            color = if (selected) Color.White else Color.White.copy(alpha = 0.6f),
            fontSize = 12.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
        )
    }
}

@Preview
@Composable
fun MainScreenPreview() {
    MaterialTheme {
        MainScreen(onNavigate = {})
    }
}
