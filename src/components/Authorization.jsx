import React, { useState } from "react";
import axios from "axios";
import {BASE_URL} from "../components/Globals";

const LABEL_STYLE = "font-gilroy_semibold text-[18px] text-[#0D062D] opacity-80";
const INPUT_FIELD_STYLE = "w-[516px] h-[56px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8]";

const Authorization = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            const accessLevel = response.data.access_level; 
    
            if (!profileId) {
                throw new Error("profile_id is missing in response");
            }
    
            localStorage.clear();
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('profile_id', profileId);
            localStorage.setItem('access_level', accessLevel); 
    
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
        <div className="w-screen h-screen bg-[#ECF2FF] content-center">
            <form
                className="w-[630px] h-[679px] flex flex-col items-center px-[57px] py-[57px] gap-16 rounded-3xl mx-auto align-baseline bg-[#FFFFFF]"
                onSubmit={auth}>
                <h1 className="text-[32px] font-gilroy_bold text-[#0D062D]">Авторизация</h1>
                <div>
                    <label id='login' className={LABEL_STYLE}>Логин</label>
                    <input type='text' id='login' 
                    className={`${INPUT_FIELD_STYLE} mt-[18px] mb-[40px] pl-[20px]`}
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    />
                    <label id='password' className={LABEL_STYLE}>Пароль</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            id='password' 
                            className={`${INPUT_FIELD_STYLE} mt-[18px] pl-[20px] pr-[50px]`}
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-gray-500 hover:text-gray-700 focus:outline-none flex items-center justify-center"
                            style={{ top: '46%', position: 'absolute' }}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
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