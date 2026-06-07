package com.etecca.futuroplus

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FilterList
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
fun CursosScreen(onNavigate: (String) -> Unit) {
    val scrollState = rememberScrollState()

    Box(modifier = Modifier.fillMaxSize().background(BackgroundWhite)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp)
        ) {
            Spacer(modifier = Modifier.height(48.dp))

            // Header with Filter Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Cursos\nRecomendados",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 36.sp,
                    color = TextBlack
                )

                Surface(
                    color = GrayLight,
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.height(40.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("Filtros", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Icon(Icons.Default.FilterList, contentDescription = null, modifier = Modifier.size(20.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Course List
            val courses = listOf(
                CourseItemData("Curso Livre:", "Marketing Digital para Iniciantes"),
                CourseItemData("Curso Técnico:", "Informática para Internet"),
                CourseItemData("Graduação:", "Ciência de Dados para Negócio"),
                CourseItemData("Curso Livre:", "Logica de Programação"),
                CourseItemData("Curso Técnico:", "Redes de Computadores")
            )

            courses.forEach { course ->
                HorizontalCourseCard(course)
                Spacer(modifier = Modifier.height(16.dp))
            }

            Spacer(modifier = Modifier.height(120.dp))
        }

        // Fixed Bottom Bar
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp)
        ) {
            BottomNavigationBar(currentScreen = "cursos", onNavigate = onNavigate)
        }
    }
}

data class CourseItemData(val type: String, val title: String)

@Composable
fun HorizontalCourseCard(course: CourseItemData) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, BorderGray)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    imageVector = AppIcons.Marketing,
                    contentDescription = null,
                    tint = OrangePrimary,
                    modifier = Modifier.size(48.dp)
                )
                
                Spacer(modifier = Modifier.width(16.dp))
                
                Column {
                    Row {
                        Text(
                            text = course.type,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = TextBlack
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = course.title,
                            fontSize = 15.sp,
                            color = TextBlack,
                            lineHeight = 18.sp
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Button(
                        onClick = { /* TODO */ },
                        colors = ButtonDefaults.buttonColors(containerColor = GrayLight),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.height(36.dp).width(160.dp),
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text("Explorar mais", color = TextBlack, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Preview
@Composable
fun CursosScreenPreview() {
    MaterialTheme {
        CursosScreen(onNavigate = {})
    }
}
