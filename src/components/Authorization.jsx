import React, { useState } from "react";
import axios from "axios";
import {BASE_URL} from "../components/Globals";

const LABEL_STYLE = "font-gilroy_semibold text-[18px] text-[#FFFFFF] opacity-80";
const INPUT_FIELD_STYLE = "w-[516px] h-[56px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8]";

const Authorization = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const auth = async (e) => {
        e.preventDefault();
    
        try {
            const response = await axios.post(`${BASE_URL}/token/`, {
                username,
                password
            }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
    
            console.log('Login response:', response.data);
    
            const accessToken = response.data.access;
            const refreshToken = response.data.refresh;
            const profileId = response.data.profile_id;
            const accessLevel = response.data.access_level; // Получаем уровень доступа
    
            if (!profileId) {
                throw new Error("profile_id is missing in response");
            }
    
            localStorage.clear();
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('profile_id', profileId);
            localStorage.setItem('access_level', accessLevel); // Сохраняем уровень доступа
    
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
            window.location.href = `/profile?id=${profileId}`;
    
        } catch (error) {
            const errorTextBox = document.getElementById('error-text');
            errorTextBox.className = LABEL_STYLE;
    
            console.error('Auth error:', error);
    
            if (error.response?.status === 401) {
                errorTextBox.textContent = 'Неверный логин или пароль! Попробуйте ещё раз.';
            } else {
                errorTextBox.textContent = 'Ошибка сервера. Попробуйте повторить вход позже!';
            }
        }
    };

    return (
        <div className="w-screen h-screen bg-[#71798C] content-center">
            <form
                className="w-[630px] h-[679px] flex flex-col items-center px-[57px] py-[57px] gap-16 rounded-3xl mx-auto align-baseline bg-[#292C33]"
                onSubmit={auth}>
                <h1 className="text-[32px] font-gilroy_bold text-[#FFFFFF]">Авторизация</h1>
                <div>
                    <label id='login' className={LABEL_STYLE}>Логин</label>
                    <input type='text' id='login' 
                    className={`${INPUT_FIELD_STYLE} mt-[18px] mb-[40px] pl-[20px]`}
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    />
                    <label id='password' className={LABEL_STYLE}>Пароль</label>
                    <input type='password' id='password' 
                    className={`${INPUT_FIELD_STYLE} mt-[18px] pl-[20px]`}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>
                <button type='submit' 
                className="w-[418px] h-[56px] rounded-lg bg-[#0077EB] opacity-90 border-0 font-gilroy_bold text-[20px] text-white
                hover:bg-[#006bd3]
                active:bg-[#0053a4]">Войти</button>
                <p id='error-text' className={`${LABEL_STYLE} hidden`}></p>
            </form>
        </div>
    );
};

export default Authorization;