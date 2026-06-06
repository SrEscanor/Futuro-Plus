package com.etecca.futuroplus

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.tooling.preview.Preview

@Composable
fun MainScreen() {
    val scrollState = rememberScrollState()

    Scaffold(
        bottomBar = {
            BottomNavigationBar()
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundWhite)
                .verticalScroll(scrollState)
                .padding(padding)
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
                            text = "Olá, Nishiyama",
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
                        text = "RN",
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
                        onClick = { /* TODO */ },
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
                    title = "Curso Técnico em Análise de Dados",
                    buttonText = "Ver todos",
                    modifier = Modifier.weight(1f)
                )
                CourseCard(
                    title = "Curso Livre: Marketing Digital",
                    buttonText = "Explorar",
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun CourseCard(title: String, buttonText: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.height(180.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Placeholder for Icon/Image
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(GrayLight, RoundedCornerShape(8.dp))
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
                colors = ButtonDefaults.buttonColors(containerColor = BluePrimary),
                shape = RoundedCornerShape(18.dp),
                contentPadding = PaddingValues(0.dp)
            ) {
                Text(buttonText, fontSize = 12.sp, color = Color.White)
            }
        }
    }
}

@Composable
fun BottomNavigationBar() {
    NavigationBar(
        containerColor = BluePrimary,
        contentColor = Color.White,
        tonalElevation = 8.dp
    ) {
        NavigationBarItem(
            icon = { /* Icon */ },
            label = { Text("Início", color = Color.White) },
            selected = true,
            onClick = { /* TODO */ },
            colors = NavigationBarItemDefaults.colors(
                indicatorColor = Color.White.copy(alpha = 0.2f)
            )
        )
        NavigationBarItem(
            icon = { /* Icon */ },
            label = { Text("Cursos", color = Color.White) },
            selected = false,
            onClick = { /* TODO */ }
        )
        NavigationBarItem(
            icon = { /* Icon */ },
            label = { Text("Testes", color = Color.White) },
            selected = false,
            onClick = { /* TODO */ }
        )
        NavigationBarItem(
            icon = { /* Icon */ },
            label = { Text("Perfil", color = Color.White) },
            selected = false,
            onClick = { /* TODO */ }
        )
    }
}

@Preview
@Composable
fun MainScreenPreview() {
    MaterialTheme {
        MainScreen()
    }
}
