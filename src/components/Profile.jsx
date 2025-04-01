import React from "react";
import { useLocation } from 'react-router-dom'; 
import axios from "axios";
import {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import avatar_placeholder from "../photos/avatar_placeholder.png";
import { BASE_URL } from "./Globals";

const H3_STYLE = 'font-gilroy_semibold text-white opacity-50 text-[16px] leading-[19px] mb-[6px]';
const DATA_STYLE = 'font-gilroy_semibold text-white text-[24px] leading-[17px]';
const BUTTON_STYLE = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-white';
const textStyleRegular = 'font-gilroy_regular text-black';
const EVENT_PLACEHOLDER_STYLE = 'w-[412px] h-[244px] rounded-3xl bg-[#36536A] p-4 mb-[12px] mr-[12px]';

const checkPlaceholder = (data) => {
    if (!data) {
        return 'Не указано'
    }
    return data
};

const Profile = () => {
    const [userdata, setUserdata] = useState('');
    const [userEvents, setUserEvents] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [users, setUsers] = useState([]);

    const query = new URLSearchParams(useLocation().search);
    const profileId = query.get('id');

    useEffect(() => {
        if(localStorage.getItem('access_token') === null){                   
            window.location.href = '/'
        } else {
            (async () => {
                try {
                    let profile_url = `${BASE_URL}/api/profile/`;
                    if (profileId) {
                        profile_url = `${BASE_URL}/api/profile/${profileId}/`
                    }
                    const data = await axios.get(profile_url, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    if (!profileId) {
                        localStorage.setItem('current_profile_id', data.data.profile.id);
                        localStorage.setItem('access_level', data.data.profile.access_level);
                    }
                    setUserdata(data.data.profile);
                    setUserEvents(data.data.events);

                    const usersData = await axios.get(`${BASE_URL}/api/users/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setUsers(usersData.data);
                } catch(e) {
                    console.log(e);
                    console.log('not auth');
                }
            })()
        };
    }, [profileId]);

    let orgs = {};
    for (const us of users) {
        orgs[us.id] = us.full_name;
    }

    const handleProfileUpdate = () => {
        const dataInForm = new FormData();
        const avatarInput = document.getElementById('avatar');
        if (!avatarInput.value && !userdata.profile_photo) {
            fetch(avatar_placeholder)
            .then(response => response.blob())
            .then(blob => {
                const file = new File([blob], 'avatar_placeholder.png', { type: "image/png" });
                userdata.profile_photo = file;
                Object.keys(userdata).forEach(key => {
                    dataInForm.append(key, userdata[key]);
                });
                sendData(dataInForm);
            })
        } else if (!avatarInput.value) {
            delete userdata.profile_photo;
            Object.keys(userdata).forEach(key => { 
                dataInForm.append(key, userdata[key]); 
            }); 
            sendData(dataInForm);
        } else {
            Object.keys(userdata).forEach(key => { 
                dataInForm.append(key, userdata[key]); 
            }); 
            sendData(dataInForm);
        }
    }

    const sendData = (dataInForm) => {
        axios.put(`${BASE_URL}/api/profile/`, dataInForm, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
        .then(response => {})
        .catch(error => { console.log(error); });
    }

    return (
        <div className="bg-[#71798C] w-screen h-auto p-6">
            <div className="w-[1283px] h-[283px] bg-[#292C33] rounded-3xl p-6">
                <div className="flex items-center mb-3">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className="font-gilroy_semibold text-white text-[32px] mr-auto leading-[38px]">Профиль</h1>
                    {+localStorage.getItem('access_level') >= 3 || +localStorage.getItem('current_profile_id') === userdata.id
                    ?
                    <button className={BUTTON_STYLE} onClick={
                        (evt) => {
                            evt.preventDefault();
                            if (isEditing) {
                                handleProfileUpdate();
                            }
                            setIsEditing(!isEditing);
                        }
                    }>{isEditing ? 'Подтвердить' : 'Редактировать'}</button>
                    :<div></div>
                    }
                </div>
                <div className="flex flex-row items-start gap-6">
                    {isEditing
                    ? <input id='avatar' type='file' alt='Фото профиля' onChange={(e) => {setUserdata({...userdata, profile_photo: e.target.files[0] })}}/>
                    : <img src={`${BASE_URL}/${userdata.profile_photo}`} width='185' height='185' alt='Кнопка профиля' className="rounded-[50%]"/>
                    }
                    <div className="flex flex-col">
                            {isEditing 
                            ? <input className="mb-6" type="text" value={`${userdata.full_name}`} onChange={(e) => {setUserdata({...userdata, full_name: e.target.value })}}/>
                            : <h2 className="font-gilroy_semibold text-white text-[32px] leading-[38px] mb-6">
                                {userdata.full_name}
                            </h2>}
                        <div className="flex flex-row gap-6 mb-6">
                            <div>
                                <h3 className={H3_STYLE}>Комиссия</h3>
                                {isEditing && userdata.access_level === 3
                                ? <input className="mb-6" type="text" value={`${checkPlaceholder(userdata.commission)}`} onChange={(e) => {setUserdata({...userdata, commission: e.target.value })}}/>
                                : <p className={DATA_STYLE}>{checkPlaceholder(userdata.commission)}</p>
                                }
                            </div>
                            <div>
                                <h3 className={H3_STYLE}>День рождения</h3>
                                {isEditing 
                                ? <input type="date" value={`${userdata.date_of_birth}`} onChange={(e) => {setUserdata({...userdata, date_of_birth: e.target.value })}}/>
                                : <p className={DATA_STYLE}>{checkPlaceholder(userdata.date_of_birth)}</p>}
                            </div>
                        </div>
                        <div className="flex flex-row gap-6">
                            {/* place-content-between */}
                            <div>
                                <h3 className={H3_STYLE}>Номер телефона</h3>
                                {isEditing 
                                ? <input type="phone" value={`${userdata.phone}`} onChange={(e) => {setUserdata({...userdata, phone: e.target.value })}}/>
                                : <p className={DATA_STYLE}>{checkPlaceholder(userdata.phone)}</p>}
                                {/* <p className={DATA_STYLE}>+7 (906) 801-50-01</p> */}
                                {/* checkPlaceholder(userdata.phone) если Максим добавит номер телефона в запрос */}
                            </div>
                            <div>
                                <h3 className={H3_STYLE}>Почта</h3>
                                {isEditing 
                                ? <input type="email" value={`${userdata.email}`} onChange={(e) => {setUserdata({...userdata, email: e.target.value })}}/>
                                : <p className={DATA_STYLE}>{checkPlaceholder(userdata.email)}</p>}
                                {/* <p className={DATA_STYLE}>rsvingr@gmail.com</p> */}
                                {/* checkPlaceholder(userdata.email) если Максим добавит почту в запрос */}
                            </div>
                            {/* <div>
                                <h3 className={H3_STYLE}>Адрес</h3>
                                <p className={DATA_STYLE}>Комсомольская улица, 70</p>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
            {+localStorage.getItem('access_level') >= 2 || +localStorage.getItem('current_profile_id') === userdata.id
            ? <div className="flex gap-6">
                {/* <div className="w-[303px] h-[490px] bg-[#292C33] rounded-3xl p-6 mt-6">
                    <div className="flex items-center mb-3">
                        <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                        <h1 className="font-gilroy_semibold text-white text-[32px] mr-auto leading-[38px]">Календарь</h1>
                    </div>
                    <div className="w-auto h-[392px] bg-white rounded-2xl"/>
                </div> */}
                <div className="w-[956px] h-[558px] bg-[#292C33] rounded-3xl p-6 mt-6 overflow-y-scroll">
                    <div className="flex items-center mb-3">
                        <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                            {/* <label className="mr-3">
                                <input type="radio" name="event" value="work" className="w-0 h-0 absolute opacity-0" checked/>
                                <h1 className="font-gilroy_semibold text-white text-[32px] leading-[38px] opacity-50">Задачи</h1>
                            </label> */}
                            <label className="mr-auto">
                                <input type="radio" name="event" value="work" className="w-0 h-0 absolute opacity-0"/>
                                <h1 className="font-gilroy_semibold text-white text-[32px] leading-[38px]">Мероприятия</h1>
                            </label>
                            {/* <button className='bg-[#0077EB] w-[103px] h-[34px] rounded-xl font-gilroy_semibold text-white text-[15px] leading-[18px] p-2'>Сортировка</button> */}
                        </div>
                        <div className="flex justify-start flex-wrap">
                        {userEvents.map((event) => {
                                return <Link to={`/event?id=${event.id}`}>
                                <div className={`${EVENT_PLACEHOLDER_STYLE}`}>
                                    <h3 className={`${textStyleSemibold} text-[32px] leading-[43px] mb-3 text-white truncate`}>{event.title}</h3>
                                    <p className={`${textStyleRegular} text-[20px] leading-[24px] mb-[51px] text-white truncate`}>{event.description}</p>
                                    <p className={`${textStyleSemibold} text-[20px] leading-[24px] mb-1 text-white`}>Организатор</p>
                                    <div className="flex">
                                        <img src={avatar_placeholder} alt='Аватарка организатора' width='23' height='23' className="rounded-[50%] mr-1"/>
                                        {   event.organizers[0] !== undefined
                                            ? <p className={`${textStyleSemibold}`}>{orgs[event.organizers[0]]}</p>
                                            : <p className={`${textStyleSemibold}`}>Не указано</p>
                                        }
                                    </div>
                                </div>
                            </Link>
                            })}
                        </div>
                        {/* <div className="w-auto h-[392px] bg-white rounded-2xl"/> */}
                    </div>
                </div>
            : <div></div>
            }
        </div>
    );
}

export default Profile;
