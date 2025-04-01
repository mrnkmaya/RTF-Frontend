import React from "react";
import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth, isSameDay } from "date-fns";
import axios from "axios";
import {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "./Globals";

const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const CALENDAR_HEADER_STYLE = 'font-gilroy_semibold leading-[39px] text-[32px] text-white';

const Calendar = () => {
    const [curDate, setCurDate] = useState(new Date());
    const curMonth = curDate.toLocaleString('ru', {month: "long"});
    const firstDayOfMonth = startOfMonth(curDate);
    const lastDayOfMonth = endOfMonth(curDate);

    const daysInMonth = eachDayOfInterval({
        start: firstDayOfMonth,
        end: lastDayOfMonth
    });

    const startingDayIndex = getDay(firstDayOfMonth) === 0 ? 6 : getDay(firstDayOfMonth) - 1;
    const endingDayIndex = getDay(lastDayOfMonth) === 0 ? 0 : 7 - getDay(lastDayOfMonth);

    // console.log(getDay(firstDayOfMonth), getDay(lastDayOfMonth), startingDayIndex, endingDayIndex);

    const [events, setEvents] = useState([]);
    const [isMy, setIsMy] = useState(false);    

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
                } catch(e) {
                    console.log(e);
                }
            })()
        };
    }, []);

    const makeDateBigger = () => {
        const prevMonth = new Date(curDate.setMonth(curDate.getMonth() + 1));
        setCurDate(prevMonth);
    }

    const makeDateSmaller = () => {
        const nextMonth = new Date(curDate.setMonth(curDate.getMonth() - 1));
        setCurDate(nextMonth);
    }
    

    // console.log(events);
    //h-screen
    return (
    <div className='mx-auto p-6 bg-[#71798C] w-screen min-h-full'>
        <div className="bg-[#292C33] rounded-3xl p-6 h-full">
            <div className="flex items-center mb-3">
                <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
                <h1 className="font-gilroy_semibold text-white text-[32px] mr-auto leading-[38px]">Календарь</h1>
                <div onClick={() => setIsMy(false)} 
                className={`rounded-tl-xl rounded-bl-xl 
                font-gilroy_medium text-white text-[16px] leading-[19px] text-center
                border px-[20px] py-[10px]
                ${!isMy ? 'bg-[#0077EB]' : 'bg-[#333740]'}`}>Все</div> 
                <div onClick={() => setIsMy(true)} 
                className={`rounded-tr-xl rounded-br-xl 
                    font-gilroy_medium text-white text-[16px] leading-[19px] text-center
                    border px-[20px] py-[10px]
                    ${isMy ? 'bg-[#0077EB]' : 'bg-[#333740]'}`}> Мои 
                </div>
            </div>
            <div className="mb-4 flex justify-center">
                <button className={CALENDAR_HEADER_STYLE} onClick={makeDateSmaller}>{'<'}</button>
                <h2 className={`${CALENDAR_HEADER_STYLE} mx-[11px]`}>{curMonth[0].toUpperCase() + curMonth.slice(1) + ` ${curDate.getFullYear()}`}</h2>
                <button className={CALENDAR_HEADER_STYLE} onClick={makeDateBigger}>{'>'}</button>
            </div>
            <div className='grid grid-cols-7 rounded-3xl border-opacity-50'>
                {WEEKDAYS.map((day) => {
                    return <div key={day} className={`font-gilroy_medium text-black text-center
                        border-b border-r border-black border-opacity-50 text-[32px] leading-[37px]
                        bg-white
                        ${day === 'вс' ? 'border-r-0 rounded-tr-3xl' : 'border-r-1'}
                        ${day === 'пн' ? 'border-l-0 rounded-tl-3xl' : 'border-l-1'}`}>{day}</div>;
                })}
                {Array.from({length: startingDayIndex}).map((_, index) => {
                    return <div key={`empty-${index}`} className={`p-2 h-[107px] text-center bg-white border border-black border-opacity-25`}/>;
                })}
                {daysInMonth.map((day, index) => {
                    let event = events.find(event => isSameDay(new Date(event.date), day));
                    // console.log(event);
                    let eventsAmount = 0
                    if (event !== undefined) {
                        if (isMy && !(event.participants.includes(+localStorage.getItem('current_profile_id')) || event.organizers.includes(+localStorage.getItem('current_profile_id')))) {
                            event = undefined;
                        }
                        eventsAmount = events.filter(event => isSameDay(new Date(event.date), day)).length
                    }
                    return <div key={index}
                    className={`h-[107px] text-center bg-white border relative
                        text-[100px] text-[#292C3340] leading-[127px] font-gilroy_heavy
                        border-black border-opacity-25 ${index === daysInMonth.length - getDay(lastDayOfMonth) ? 'rounded-bl-3xl' : ''}`}>
                            {<Link to={`/event-page?date=${format(day, 'yyyy-MM-dd')}`} className='cursor-pointer'>{format(day, 'd')}</Link>}
                            {event && (
                                <Link to={`/event?id=${event.id}`} className="block bg-[#4DAEFF33] w-auto h-1/3 absolute inset-0 z-10 p-2 rounded-xl mt-auto"> 
                                    <div className="text-black font-gilroy_semibold text-2xl leading-[29px] text-ellipsis overflow-hidden whitespace-nowrap">{`${event.title}`}</div> 
                                </Link>)}
                        </div>;
                })}
                {Array.from({length: endingDayIndex}).map((_, index) => {
                    return <div key={`empty-${index}`} 
                    className={`p-2 h-[107px] text-center bg-white border 
                        border-black border-opacity-25 ${index === endingDayIndex - 1 ? 'rounded-br-3xl' : ''}`}/>;
                })}
            </div>
        </div>
    </div>
    );
}

export default Calendar;