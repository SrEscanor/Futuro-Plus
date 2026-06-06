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

    suspend fun signUp(email: String, password: String): Result<Unit> {
        return try {
            auth.createUserWithEmailAndPassword(email, password)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getCurrentUser() = auth.currentUser

    suspend fun signOut() = auth.signOut()
}
