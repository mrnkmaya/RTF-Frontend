// import React, { useEffect, useState } from "react";
// import { useLocation } from 'react-router-dom'; 
// import axios from "axios";
// import avatar_placeholder from "../photos/avatar_placeholder.png";
// import { BASE_URL } from "./Globals";

// const H3_STYLE = 'font-gilroy_semibold text-white opacity-50 text-[16px] leading-[19px] mb-[6px]';
// const DATA_STYLE = 'font-gilroy_semibold text-white text-[24px] leading-[17px]';
// const BUTTON_STYLE = 'bg-[#0077EB] w-[160px] h-[40px] rounded-xl font-gilroy_semibold text-white text-xl p-2';
// const INPUT_FIELD_STYLE = "w-[400px] h-[40px] rounded-lg bg-[#F1F4F9] border-[#D8D8D8]";

// const checkPlaceholder = (data) => {
//     return data ? data : 'Не указано';
// };

// const OtherProfile = () => {
//     const [userdata, setUserdata] = useState({});
//     const [isEditing, setIsEditing] = useState(false);

//     const query = new URLSearchParams(useLocation().search);
//     const profileId = query.get('id');

//     const myAccessLevel = +localStorage.getItem('access_level');
//     const myCommission = localStorage.getItem('commission');

//     useEffect(() => {
//         if (localStorage.getItem('access_token') === null) {
//             window.location.href = '/';
//         } else {
//             (async () => {
//                 try {
//                     const response = await axios.get(`${BASE_URL}/api/profile_view/${profileId}/`, {
//                         headers: {
//                             'Content-Type': 'application/json',
//                             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//                         }
//                     });
//                     setUserdata(response.data.profile);
//                 } catch (e) {
//                     console.error(e);
//                 }
//             })();
//         }
//     }, [profileId]);

//     const canEdit = () => {
//         if (myAccessLevel === 3) {
//             return true;
//         }
//         if (myAccessLevel === 2 && userdata.commission === myCommission) {
//             return true;
//         }
//         return false;
//     };

//     const handleProfileUpdate = () => {
//         const dataInForm = new FormData();
//         Object.keys(userdata).forEach(key => {
//             dataInForm.append(key, userdata[key]);
//         });

//         axios.put(`${BASE_URL}/api/profile/${userdata.user}/`, dataInForm, {
//             headers: {
//                 'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//             }
//         })
//         .then(response => {})
//         .catch(error => { console.log(error); });
//     };

//     return (
//         <div className="bg-[#71798C] w-screen h-auto p-6">
//             <div className="w-[1283px] h-[300px] bg-[#292C33] rounded-3xl p-6">
//                 <div className="flex items-center mb-3">
//                     <div className="h-[29px] w-[8px] bg-[#008CFF] rounded mr-2"/>
//                     <h1 className="font-gilroy_semibold text-white text-[32px] mr-auto leading-[38px]">Просмотр профиля</h1>
//                     {canEdit() && (
//                         <button className={BUTTON_STYLE} onClick={(evt) => {
//                             evt.preventDefault();
//                             if (isEditing) {
//                                 handleProfileUpdate();
//                             }
//                             setIsEditing(!isEditing);
//                         }}>
//                             {isEditing ? 'Подтвердить' : 'Редактировать'}
//                         </button>
//                     )}
//                 </div>

//                 <div className="flex flex-row items-start gap-6">
//                     <img src={userdata.profile_photo ? `${BASE_URL}/${userdata.profile_photo}` : avatar_placeholder} 
//                         width='185' 
//                         height='185' 
//                         alt='Фото профиля' 
//                         className="rounded-[50%]"
//                     />
//                     <div className="flex flex-col">
//                         <h2 className="font-gilroy_semibold text-white text-[32px] leading-[38px] mb-6">
//                             {checkPlaceholder(userdata.full_name)}
//                         </h2>
//                         <div className="flex flex-row gap-6 mb-6">
//                             <div>
//                                 <h3 className={H3_STYLE}>Комиссия</h3>
//                                 {isEditing
//                                     ? <input className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`} type="text" value={userdata.commission || ''} onChange={(e) => setUserdata({...userdata, commission: e.target.value})}/>
//                                     : <p className={DATA_STYLE}>{checkPlaceholder(userdata.commission)}</p>
//                                 }
//                             </div>
//                             <div>
//                                 <h3 className={H3_STYLE}>День рождения</h3>
//                                 {isEditing
//                                     ? <input className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`} type="date" value={userdata.date_of_birth || ''} onChange={(e) => setUserdata({...userdata, date_of_birth: e.target.value})}/>
//                                     : <p className={DATA_STYLE}>{checkPlaceholder(userdata.date_of_birth)}</p>
//                                 }
//                             </div>
//                         </div>
//                         <div className="flex flex-row gap-6">
//                             <div>
//                                 <h3 className={H3_STYLE}>Номер телефона</h3>
//                                 {isEditing
//                                     ? <input className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`} type="text" value={userdata.number_phone || ''} onChange={(e) => setUserdata({...userdata, number_phone: e.target.value})}/>
//                                     : <p className={DATA_STYLE}>{checkPlaceholder(userdata.number_phone)}</p>
//                                 }
//                             </div>
//                             <div>
//                                 <h3 className={H3_STYLE}>Почта</h3>
//                                 {isEditing
//                                     ? <input className={`${INPUT_FIELD_STYLE} w-[250px] pl-[10px]`} type="email" value={userdata.email || ''} onChange={(e) => setUserdata({...userdata, email: e.target.value})}/>
//                                     : <p className={DATA_STYLE}>{checkPlaceholder(userdata.email)}</p>
//                                 }
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default OtherProfile;
