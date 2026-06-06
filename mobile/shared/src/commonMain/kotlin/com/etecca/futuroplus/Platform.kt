package com.etecca.futuroplus

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform