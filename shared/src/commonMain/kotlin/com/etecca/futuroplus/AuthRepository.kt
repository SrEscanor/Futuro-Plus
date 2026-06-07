package com.etecca.futuroplus

import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth

class AuthRepository {
    private val auth = Firebase.auth

    suspend fun signIn(email: String, password: String): Result<Unit> {
        return try {
            auth.signInWithEmailAndPassword(email, password)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signUp(email: String, password: String, name: String): Result<Unit> {
        return try {
            val authResult = auth.createUserWithEmailAndPassword(email, password)
            authResult.user?.updateProfile(displayName = name)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getCurrentUser() = auth.currentUser

    suspend fun signOut() = auth.signOut()
}
