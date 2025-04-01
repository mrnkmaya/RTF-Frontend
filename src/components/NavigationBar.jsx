import React from "react";
import profile from '../vector-images/profileicon.svg';
import group from '../vector-images/groupicon.svg';
import calendar from '../vector-images/calendaricon.svg';
import archive from '../vector-images/archiveicon.svg';
import events from '../vector-images/eventsicon.svg';
import { Link } from "react-router-dom";

const NavigationBar = () => {
    return (
        <div className='bg-[#474D59] w-[109px] p-6'>
            <label className="block w-[61px] h-[61px] mx-auto mb-[23px]">
                <Link to='/profile'>
                    <div className="w-[61px] h-[61px] bg-[#333740] rounded-xl px-[18.3px] py-[13.98px]">
                        <img src={profile} alt='Кнопка профиля' className="cursor-pointer w-[24.4px] h-[30.5px]"/>
                    </div>
                </Link>
            </label>
            <label className="block w-[61px] h-[61px] mx-auto mb-[23px]">
                <Link to='/team'>
                    <div className='w-[61px] h-[61px] bg-[#333740] rounded-xl px-[12.2px] py-[16.52px]'>
                        <img src={group} alt='Кнопка групп' className="cursor-pointer w-[36.6px] h-[30.5px]"/>
                    </div>
                </Link>
            </label>
            <label className="block w-[61px] h-[61px] mx-auto mb-[23px]">
                <Link to='/calendar'>
                    <div className="w-[61px] h-[61px] bg-[#333740] rounded-xl px-[14.235px] py-[12.2px]">
                        <img src={calendar} alt='Кнопка календаря' className="cursor-pointer w-[32.53px] h-[36.6px]"/>
                    </div>
                </Link>
            </label>
            <label className="block w-[61px] h-[61px] mx-auto mb-[23px]">
                <Link to='/events'>
                    <div className="w-[61px] h-[61px] bg-[#333740] rounded-xl p-[12.2px]">
                        <img src={events} alt='Кнопка файлов' className="cursor-pointer w-[36.6px] h-[36.6px]"/>
                    </div>
                </Link>
            </label>
            <label className="block w-[61px] h-[61px] mx-auto mb-[23px]">
                <Link to='/archive'>
                    <div className="w-[61px] h-[61px] bg-[#333740] rounded-xl p-[12.2px]">
                        <img src={archive} alt='Кнопка файлов' className="cursor-pointer w-[36.6px] h-[36.6px]"/>
                    </div>
                </Link>
            </label>
        </div>
    );
}

export default NavigationBar;
