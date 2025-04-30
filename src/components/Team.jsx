import React from "react";
import axios from "axios";
import {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "./Globals";

const H3_STYLE = 'font-gilroy_semibold text-[#0D062D] opacity-50 text-[16px] leading-[19px] mb-[6px]';
const DATA_STYLE = 'font-gilroy_semibold text-[#0D062D] text-[24px] leading-[17px]';
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
        <div className="bg-[#ECF2FF] w-full h-full p-6">
            {users.map((user) => {
                return <div key={user.id} className="w-[1283px] h-fit bg-[#FFFFFF] rounded-3xl p-6 flex justify-between items-center mb-6">
                    <div className="flex flex-row items-start gap-6">
                    <div className="relative w-[185px] h-[185px]">
                                <div className="relative w-full h-full overflow-hidden rounded-full">
                                    <img
                                        src={user.profile_photo 
                                            ? `${BASE_URL}${user.profile_photo}`
                                            : '/path/to/default/avatar.png'}
                                        alt={`Фото ${user.full_name}`}
                                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover"
                                    />
                                </div>
                            </div>
                        
                        
                        <div className="flex flex-col">
                            <h2 className="font-gilroy_semibold text-[#0D062D] text-[32px] leading-[38px] mb-6">{user.full_name}</h2>
                            <div className="flex flex-row gap-6 mb-6">
                                <div>
                                    <h3 className={H3_STYLE}>Комиссия</h3>
                                    <p className={DATA_STYLE}>{checkPlaceholder(user.commission)}</p>
                                </div>
                                <div>
                                    <h3 className={H3_STYLE}>День рождения</h3>
                                    <p className={DATA_STYLE}>{checkPlaceholder(new Date(user.date_of_birth).toLocaleDateString())}</p>
                                </div>
                            </div>
                            <div className="flex flex-row gap-6">
                                {/* place-content-between */}
                                <div>
                                    <h3 className={H3_STYLE}>Номер телефона</h3>
                                    <p className={DATA_STYLE}>{checkPlaceholder(user.number_phone)}</p>
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
                        <button value={user.id} className={`${BUTTON_STYLE} text-xl align-baseline` }>Профиль</button>
                    </Link>
                    {/* onClick={(evt) => {window.location.href = `/profile?id=${user.id}`}} */}
                </div>
            })}
        </div>
    );
}

export default Team;