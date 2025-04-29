import React from "react";
import axios from "axios";
import {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import avatar_placeholder from "../photos/avatar_placeholder.png";
import {BASE_URL} from "../components/Globals";

const buttonStyle = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
const textStyleSemibold = 'font-gilroy_semibold text-[#0D062D]';
const textStyleRegular = 'font-gilroy_regular text-black';
const EVENT_PLACEHOLDER_STYLE = 'w-[412px] h-[244px] rounded-3xl bg-[#CCE8FF] p-6 mb-[12px] mr-[12px]';

const Archive = () => {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if(localStorage.getItem('access_token') === null){                   
            window.location.href = '/'
        } else {
            (async () => {
                try {
                    const data = await axios.get(`${BASE_URL}/api/events/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setEvents(data.data);

                    const usersData = await axios.get(`${BASE_URL}/api/users/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    setUsers(usersData.data);
                } catch(e) {
                    console.log(`Error: ${e}`);
                }
            })()
        };
    }, []);
    let orgs = {};
    for (const user of users) {
        orgs[user.id] = user.full_name;
    }

    return (
        <div id='background' className="bg-[#ECF2FF] w-screen h-auto p-6">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 h-screen overflow-y-scroll">
                <div className="flex items-center mb-[24px]">
                    <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                    <h1 className={`${textStyleSemibold} text-[40px] leading-[48px] mr-auto`}>Архив мероприятий</h1>
                    {/* <button className={`${buttonStyle} mr-3`}>Сортировать</button> */}
                </div>
                <div id='success' className="hidden w-[610px] h-fit bg-[#5C6373] z-50 
                absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2
                rounded-3xl p-6 text-center">
                    <p className={`font-gilroy_heavy text-[#0D062D] w-fit text-[32px] mx-auto mb-12`}>Мероприятие успешно создано!</p>
                    <button onClick={() => {
                        const successMessage = document.getElementById('success');
                        successMessage.classList.add('hidden');
                    }} className={`${buttonStyle}`}>Подтвердить</button>
                </div>
                <div className="flex justify-start flex-wrap">
                    {events.map((event) => {
                        if (event.is_past) {
                        return <Link to={`/event?id=${event.id}`}>
                            <div className={`${EVENT_PLACEHOLDER_STYLE} flex flex-col`}>
                                <h3 className={`${textStyleSemibold} text-[32px] leading-[43px] mb-3 text-[#0D062D] truncate`}>{event.title}</h3>
                                <p className={`${textStyleRegular} text-[20px] leading-[24px] mb-[51px] text-[#0D062D] truncate`}>{event.description}</p>
                                <p className={`${textStyleSemibold} text-[20px] leading-[24px] mb-1 text-[#0D062D] mt-auto`}>Организатор</p>
                                <div className="flex">
                                    <img src={avatar_placeholder} alt='Аватарка организатора' width='23' height='23' className="rounded-[50%] mr-1"/>
                                    {   event.organizers[0] !== undefined
                                        ? <p className={`${textStyleSemibold}`}>{orgs[event.organizers[0]]}</p>
                                        : <p className={`${textStyleSemibold}`}>Не указано</p>
                                    }
                                </div>
                            </div>
                        </Link>}
                    })}
                </div>
            </div>
        </div>
    );
}

export default Archive;
