import React from "react";
import axios from "axios";
import {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "./Globals";

const H3_STYLE = 'font-gilroy_semibold text-white opacity-50 text-[16px] leading-[19px] mb-[6px]';
const DATA_STYLE = 'font-gilroy_semibold text-white text-[24px] leading-[17px]';
const BUTTON_STYLE = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white p-2';

const checkPlaceholder = (data) => {
    if (!data) {
        return 'Не указано'
    }
    return data
};

const Team = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if(localStorage.getItem('access_token') === null){                   
            window.location.href = '/'
        } else {
            (async () => {
                try {
                    const data = await axios.get(`${BASE_URL}/api/users/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setUsers(data.data);
                } catch(e) {
                    console.log(e);
                }
            })()
        };
    }, []);

    return (
        <div className="bg-[#71798C] w-screen h-screen p-6">
            {users.map((user) => {
                return <div className="w-[1283px] h-fit bg-[#292C33] rounded-3xl p-6 flex justify-between items-center mb-6">
                    {/* <div className="flex items-center mb-3">
                        <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                        <h1 className="font-gilroy_semibold text-white text-[32px] mr-auto leading-[38px]">Профиль</h1>
                    </div> */}
                    <div className="flex flex-row items-start gap-6">
                        <img src={`${BASE_URL}/${user.profile_photo}`} width='185' height='185' alt='Кнопка профиля' className="rounded-[50%]"/>
                        <div className="flex flex-col">
                            <h2 className="font-gilroy_semibold text-white text-[32px] leading-[38px] mb-6">{user.full_name}</h2>
                            <div className="flex flex-row gap-6 mb-6">
                                <div>
                                    <h3 className={H3_STYLE}>Комиссия</h3>
                                    <p className={DATA_STYLE}>{checkPlaceholder(user.commission)}</p>
                                </div>
                                <div>
                                    <h3 className={H3_STYLE}>День рождения</h3>
                                    <p className={DATA_STYLE}>{checkPlaceholder(user.date_of_birth)}</p>
                                </div>
                            </div>
                            <div className="flex flex-row gap-6">
                                {/* place-content-between */}
                                <div>
                                    <h3 className={H3_STYLE}>Номер телефона</h3>
                                    <p className={DATA_STYLE}>{checkPlaceholder(user.phone)}</p>
                                    {/* <p className={DATA_STYLE}>+7 (906) 801-50-01</p> */}
                                    {/* checkPlaceholder(userdata.phone) если Максим добавит номер телефона в запрос */}
                                </div>
                                <div>
                                    <h3 className={H3_STYLE}>Почта</h3>
                                    <p className={DATA_STYLE}>{checkPlaceholder(user.email)}</p>
                                    {/* <p className={DATA_STYLE}>rsvingr@gmail.com</p> */}
                                    {/* checkPlaceholder(userdata.email) если Максим добавит почту в запрос */}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Link to={`/profile?id=${user.id}`}>
                        <button value={user.id} className={`${BUTTON_STYLE} text-xl align-baseline`}>Профиль</button>
                    </Link>
                    {/* onClick={(evt) => {window.location.href = `/profile?id=${user.id}`}} */}
                </div>
            })}
        </div>
    );
}

export default Team;
