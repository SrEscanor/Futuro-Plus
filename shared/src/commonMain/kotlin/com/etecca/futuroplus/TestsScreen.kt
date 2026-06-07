package com.etecca.futuroplus

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.tooling.preview.Preview

@Composable
fun TestsScreen(onNavigate: (String) -> Unit) {
    val scrollState = rememberScrollState()

    Box(modifier = Modifier.fillMaxSize().background(BackgroundWhite)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp)
        ) {
            Spacer(modifier = Modifier.height(48.dp))

            Text(
                text = "Faça seu\nTeste de Perfil!",
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextBlack,
                lineHeight = 38.sp
            )

            Spacer(modifier = Modifier.height(32.dp))

            TestCard(
                title = "Testes de Interesses Profissionais",
                description = "Descubra em quais áreas você tem mais afinidade e motivação para trabalhar."
            )

            Spacer(modifier = Modifier.height(24.dp))

            TestCard(
                title = "Teste de Habilidades Técnicas",
                description = "Avalie suas competências em matemática, lógica, comunicação e raciocínio analítico."
            )

            Spacer(modifier = Modifier.height(24.dp))

            TestCard(
                title = "Teste de Carreira Futurista",
                description = "Veja profissões emergentes e descubra se seu perfil combina com as tendências do mercado."
            )

            Spacer(modifier = Modifier.height(120.dp))
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp)
        ) {
            BottomNavigationBar(currentScreen = "testes", onNavigate = onNavigate)
        }
    }
}

@Composable
fun TestCard(title: String, description: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = Color(0xFFF0F9FA) // Azul clarinho/Ciano como na imagem
    ) {
        Column(
            modifier = Modifier.padding(24.dp)
        ) {
            Text(
                text = title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TextBlack
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row {
                Text(text = "◆ ", color = BluePrimary, fontSize = 14.sp)
                Text(
                    text = description,
                    fontSize = 14.sp,
                    color = Color.Gray,
                    lineHeight = 20.sp
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = { /* TODO */ },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                shape = RoundedCornerShape(24.dp),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
            ) {
                Text(
                    text = "Fazer teste de perfil",
                    color = TextBlack,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }
        }
    }
}

@Preview
@Composable
fun TestsScreenPreview() {
    MaterialTheme {
        TestsScreen(onNavigate = {})
    }
}
