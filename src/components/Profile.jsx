import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import avatar_placeholder from "../photos/avatar_placeholder.png";
import { BASE_URL } from "./Globals";

const H3_STYLE = 'font-gilroy_semibold text-white opacity-50 text-[16px] leading-[19px] mb-[6px]';
const DATA_STYLE = 'font-gilroy_semibold text-white text-[24px] leading-[17px]';
const BUTTON_STYLE = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const INPUT_FIELD_STYLE = "w-[400px] h-[40px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8]";

const checkPlaceholder = (data) => {
    return data ? data : 'Не указано';
};

const Profile = () => {
    const [userdata, setUserdata] = useState({});
    const [events, setEvents] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [searchParams] = useSearchParams();

    // Получаем ID профиля из URL или из localStorage (для своего профиля)
    const profileId = searchParams.get('id') || localStorage.getItem('profile_id');

    useEffect(() => {
        if (localStorage.getItem('access_token') === null) {
            window.location.href = '/';
        } else {
            (async () => {
                try {
                    // Получение данных профиля
                    const profileResponse = await axios.get(`${BASE_URL}/api/profile/${profileId}/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setUserdata(profileResponse.data.profile);

                    // Получение мероприятий пользователя
                    const eventsResponse = await axios.get(`${BASE_URL}/api/profile_view/${profileId}/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setEvents(eventsResponse.data.events);
                } catch (e) {
                    console.error("Ошибка при загрузке данных:", e);
                }
            })();
        }
    }, [profileId]); // Добавляем profileId в зависимости useEffect

    const handleProfileUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append('commission', userdata.commission || '');
            formData.append('date_of_birth', userdata.date_of_birth || '');
            formData.append('number_phone', userdata.number_phone || '');
            formData.append('email', userdata.email || '');
            
            if (userdata.profile_photo && typeof userdata.profile_photo === 'object') {
                formData.append('profile_photo', userdata.profile_photo);
            }
    
            await axios.put(`${BASE_URL}/api/profile/${profileId}/`, formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setIsEditing(false);
            const response = await axios.get(`${BASE_URL}/api/profile/${profileId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            setUserdata(response.data.profile);
            
        } catch (error) {
            console.error("Ошибка при обновлении профиля:", error.response?.data || error.message);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUserdata({...userdata, profile_photo: e.target.files[0]});
        }
    };

    return (
        <div className="bg-[#71798C] w-screen h-auto p-6">
            <div className="w-[1283px] h-auto bg-[#292C33] rounded-3xl p-6 mb-6">
                <div className="flex items-center mb-3">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className="font-gilroy_semibold text-white text-[32px] mr-auto leading-[38px]">
                        {profileId === localStorage.getItem('profile_id') ? 'Мой профиль' : 'Профиль пользователя'}
                    </h1>
                    
                    {profileId === localStorage.getItem('profile_id') && (
                        <button 
                            className={BUTTON_STYLE} 
                            onClick={() => {
                                if (isEditing) {
                                    handleProfileUpdate();
                                }
                                setIsEditing(!isEditing);
                            }}
                        >
                            {isEditing ? 'Подтвердить' : 'Редактировать'}
                        </button>
                    )}
                </div>

                <div className="flex flex-row items-start gap-6">
                    <div className="relative">
                        <img 
                            src={
                                userdata.profile_photo 
                                    ? typeof userdata.profile_photo === 'object'
                                        ? URL.createObjectURL(userdata.profile_photo)
                                        : `${BASE_URL}${userdata.profile_photo}`
                                    : avatar_placeholder
                            } 
                            width="185" 
                            height="185" 
                            alt="Фото профиля" 
                            className="rounded-[50%] object-cover"
                        />
                        {isEditing && (
                            <div className="absolute bottom-0 right-0">
                                <label className="cursor-pointer bg-blue-500 text-white p-1 rounded">
                                    Изменить
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col">
                        <h2 className="font-gilroy_semibold text-white text-[32px] leading-[38px] mb-6">
                            {checkPlaceholder(userdata.full_name)}
                        </h2>
                        
                        <div className="flex flex-row gap-6 mb-6">
                            <div>
                                <h3 className={H3_STYLE}>Комиссия</h3>
                                {isEditing ? (
                                    <input 
                                        className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`} 
                                        value={userdata.commission || ''} 
                                        onChange={(e) => setUserdata({...userdata, commission: e.target.value})}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(userdata.commission)}</p>
                                )}
                            </div>
                            
                            <div>
                                <h3 className={H3_STYLE}>День рождения</h3>
                                {isEditing ? (
                                    <input 
                                        type="date"
                                        className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`} 
                                        value={userdata.date_of_birth || ''} 
                                        onChange={(e) => setUserdata({...userdata, date_of_birth: e.target.value})}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(userdata.date_of_birth)}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-row gap-6">
                            <div>
                                <h3 className={H3_STYLE}>Номер телефона</h3>
                                {isEditing ? (
                                    <input 
                                        className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`} 
                                        value={userdata.number_phone || ''} 
                                        onChange={(e) => setUserdata({...userdata, number_phone: e.target.value})}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(userdata.number_phone)}</p>
                                )}
                            </div>
                            
                            <div>
                                <h3 className={H3_STYLE}>Почта</h3>
                                {isEditing ? (
                                    <input 
                                        type="email"
                                        className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`} 
                                        value={userdata.email || ''} 
                                        onChange={(e) => setUserdata({...userdata, email: e.target.value})}
                                    />
                                ) : (
                                    <p className={DATA_STYLE}>{checkPlaceholder(userdata.email)}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Блок мероприятий */}
            <div className="w-[600px] h-auto bg-[#292C33] rounded-3xl p-6">
                <div className="flex items-center mb-6">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h2 className="font-gilroy_semibold text-white text-[32px] leading-[38px]">
                        {profileId === localStorage.getItem('profile_id') ? 'Мои мероприятия' : 'Мероприятия пользователя'}
                    </h2>
                </div>

                {events.length > 0 ? (
                    <div className="grid grid-cols-3 gap-6">
                        {events.map(event => (
                            <div key={event.id} className="bg-[#394150] p-4 rounded-xl">
                                <h3 className="font-gilroy_semibold text-white text-xl mb-2">{event.title}</h3>
                                <p className="text-white text-opacity-70 text-sm">{event.description}</p>
                                <p className="text-white text-opacity-50 text-xs mt-2">
                                    {new Date(event.date).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-white text-opacity-50">
                        {profileId === localStorage.getItem('profile_id') 
                            ? 'У вас пока нет мероприятий' 
                            : 'У пользователя нет мероприятий'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Profile;