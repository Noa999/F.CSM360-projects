import { supabase } from './supabase.js'

const authForm = document.getElementById('auth-form')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const btnRegister = document.getElementById('btn-register')

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        window.location.href = 'dashboard.html'
    }
})

authForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value
    })

    if (error) {
        alert("Нэвтрэхэд алдаа гарлаа: " + error.message)
        return
    }
    window.location.href = 'dashboard.html'
})

btnRegister.addEventListener('click', async () => {
    if (!authForm.reportValidity()) return

    if (passwordInput.value.length < 6) {
        alert("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой!")
        return
    }

    const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value
    })

    if (error) {
        alert("Бүртгүүлэхэд алдаа гарлаа: " + error.message)
        return
    }

    if (data.session) {
        window.location.href = 'dashboard.html'
    } else {
        alert("Бүртгэл амжилттай үүслээ. Имэйлээ баталгаажуулаад нэвтэрнэ үү.")
    }
})
