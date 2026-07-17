// ============================================================
//  Casa del Rey — Liquid Glass LIGHT primitives
//  Icon · Halos · Badge · GlassButton · Eyebrow · Field · Surface
//  Apple HIG · Lienzo blanco · Squircles · Spring physics
// ============================================================

import { forwardRef } from 'react';

/* ---------- Minimal stroked icons ---------- */
const PATHS = {
  menu:      <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="14" x2="21" y2="14" /></>,
  close:     <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  arrow:     <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></>,
  play:      <polygon points="8 5 19 12 8 19 8 5" fill="currentColor" stroke="none" />,
  pin:       <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></>,
  clock:     <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></>,
  calendar:  <><rect x="3.5" y="5" width="17" height="16" rx="3" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="3" x2="8" y2="6.5" /><line x1="16" y1="3" x2="16" y2="6.5" /></>,
  spark:     <path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
  heart:     <path d="M12 20s-7-4.4-9.2-9C1.2 7.7 3 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.3.6-1.1 1.8-2.3 3.8-2.3 3.2 0 5 3.2 3.4 6.5C19 15.6 12 20 12 20Z" />,
  book:      <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><line x1="4" y1="18.5" x2="20" y2="18.5" /></>,
  users:     <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2" /><path d="M16 5.2a3 3 0 0 1 0 5.8M16.5 14.9c2.5.4 4 2.3 4 5.1" /></>,
  music:     <><circle cx="7" cy="18" r="2.6" /><circle cx="18" cy="16" r="2.6" /><path d="M9.6 18V7l11-2.2v11" /></>,
  chat:      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5V7a2 2 0 0 1 2-2Z" />,
  check:     <polyline points="5 12.5 10 17.5 19 7" />,
  mail:      <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
  phone:     <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></>,
  youtube:   <><rect x="3" y="6" width="18" height="12" rx="4" /><polygon points="11 9.5 15 12 11 14.5" fill="currentColor" stroke="none" /></>,
  crown:     <path d="M4 17h16M4 17l-1.5-9 5 4 4.5-7 4.5 7 5-4L20 17" />,
  user:      <><circle cx="12" cy="8" r="4" /><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" /></>,
  lock:      <><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  search:    <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>,
  gift:      <><rect x="3.5" y="9" width="17" height="11" rx="2" /><path d="M3.5 13h17M12 9v11" /><path d="M12 9C9 9 7.5 4 12 4M12 9c3 0 4.5-5 0-5" /></>,
  mic:       <><rect x="9" y="2.5" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="8.5" y1="21" x2="15.5" y2="21" /></>,
  flag:      <><line x1="5" y1="3" x2="5" y2="21" /><path d="M5 4h13l-3 4 3 4H5Z" /></>,
  camera:    <><path d="M4 8h3l1.5-2.5h7L17 8h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13.5" r="3.6" /></>,
  headphones: <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="2.5" y="14" width="4" height="6" rx="1.6" /><rect x="17.5" y="14" width="4" height="6" rx="1.6" /></>,
  pray:      <><path d="M12 4v16" /><path d="M12 4c-3 2-4 5-4 8 0 3 1.5 5.5 4 8" /><path d="M12 4c3 2 4 5 4 8 0 3-1.5 5.5-4 8" /></>,
  box:       <><path d="M3.5 8.5 12 4l8.5 4.5-8.5 4.5-8.5-4.5Z" /><path d="M3.5 8.5v7L12 20l8.5-4.5v-7" /><line x1="12" y1="13" x2="12" y2="20" /></>,

  /* ---------- Panel admin/líder/voluntario (migrados de Material Symbols) ---------- */
  dashboard:    <><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.8" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.8" /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.8" /><rect x="13" y="13" width="7.5" height="7.5" rx="1.8" /></>,
  trending_up:  <><polyline points="3 17 9 11 13 15 21 7" /><polyline points="14 7 21 7 21 14" /></>,
  settings:     <><circle cx="12" cy="12" r="3.3" /><path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6" /></>,
  view_carousel:<><rect x="2" y="6" width="4" height="12" rx="1" /><rect x="8" y="3.5" width="8" height="17" rx="1.5" /><rect x="18" y="6" width="4" height="12" rx="1" /></>,
  article:      <><rect x="4" y="3" width="16" height="18" rx="2" /><line x1="7.5" y1="8" x2="16.5" y2="8" /><line x1="7.5" y1="12" x2="16.5" y2="12" /><line x1="7.5" y1="16" x2="13" y2="16" /></>,
  photo_library:<><rect x="2.5" y="5.5" width="14" height="14" rx="2" /><path d="M2.5 15l3.3-3.6a1.6 1.6 0 0 1 2.3 0L11 14.5" /><circle cx="7" cy="9.5" r="1.4" /><path d="M8 3.5h11a2 2 0 0 1 2 2v11" /></>,
  share:        <><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="6" r="2.6" /><circle cx="18" cy="18" r="2.6" /><line x1="8.3" y1="10.8" x2="15.7" y2="7.2" /><line x1="8.3" y1="13.2" x2="15.7" y2="16.8" /></>,
  help_center:  <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.3a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.2 1-1.2 1.9" /><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" /></>,
  campaign:     <><path d="M3 10v4a1.5 1.5 0 0 0 1.5 1.5H6l3.5 4V4.5L6 8.5H4.5A1.5 1.5 0 0 0 3 10Z" /><path d="M14 9a4 4 0 0 1 0 6M17 6a8 8 0 0 1 0 12" /></>,
  manage_accounts: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3.1 2.4-5 5.5-5s5.5 1.9 5.5 5" /><circle cx="18" cy="17" r="3" /><path d="M18 14.5v1M18 18.5v1M15.5 17h1M19.5 17h1M16 15l.8.8M19.2 18.2l.8.8M20 15l-.8.8M16.8 18.2l-.8.8" /></>,
  badge:        <><rect x="4" y="6.5" width="16" height="14" rx="2.5" /><path d="M9 6.5V5a3 3 0 0 1 6 0v1.5" /><circle cx="12" cy="12.5" r="2.2" /><path d="M8.5 17.5c.6-1.6 1.9-2.4 3.5-2.4s2.9.8 3.5 2.4" /></>,
  group_add:    <><circle cx="8" cy="9" r="3" /><path d="M2.5 19c0-3 2.4-4.8 5.5-4.8s5.5 1.8 5.5 4.8" /><line x1="18" y1="8" x2="18" y2="14" /><line x1="15" y1="11" x2="21" y2="11" /></>,
  contact_page: <><rect x="3.5" y="4" width="17" height="16" rx="2.3" /><circle cx="9.5" cy="10.5" r="2.2" /><path d="M6.3 16c.4-1.7 1.6-2.6 3.2-2.6s2.8.9 3.2 2.6" /><line x1="15" y1="9" x2="17.5" y2="9" /><line x1="15" y1="12.5" x2="17.5" y2="12.5" /></>,
  volunteer_activism: <><path d="M7 13V6.5a1.8 1.8 0 0 1 3.6 0V11" /><path d="M10.6 8.5a1.8 1.8 0 0 1 3.6 0V11" /><path d="M14.2 9a1.7 1.7 0 0 1 3.4 0v4.5c0 3.6-2.4 6-6.6 6-2.6 0-4.3-.9-5.6-2.5L3 14.3c-.6-.8-.4-1.9.5-2.4.7-.4 1.5-.2 2 .4l1.5 1.7" /></>,
  person_add:   <><circle cx="9" cy="8" r="3.3" /><path d="M3 19.5c0-3.2 2.5-5.3 6-5.3s6 2.1 6 5.3" /><line x1="18" y1="7" x2="18" y2="13" /><line x1="15" y1="10" x2="21" y2="10" /></>,
  person_search:<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c0-3.1 2.4-5 5.5-5 .7 0 1.4.1 2 .3" /><circle cx="16.5" cy="15.5" r="3" /><line x1="18.7" y1="17.7" x2="21" y2="20" /></>,
  receipt_long: <><path d="M6 3h12v17.5l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3Z" /><line x1="8.5" y1="8" x2="15.5" y2="8" /><line x1="8.5" y1="11.5" x2="15.5" y2="11.5" /></>,
  history:      <><path d="M3 12a9 9 0 1 0 3-6.7" /><polyline points="3 4 3 8.5 7.5 8.5" /><polyline points="12 7 12 12.5 16 15" /></>,
  logout:       <><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><polyline points="15 8 19.5 12 15 16" /><line x1="19" y1="12" x2="8.5" y2="12" /></>,
  public:       <><circle cx="12" cy="12" r="9" /><line x1="3" y1="12" x2="21" y2="12" /><path d="M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9Z" /></>,
  chevron_left: <polyline points="15 5 9 12 15 19" />,
  chevron_right:<polyline points="9 5 15 12 9 19" />,
  download:     <><path d="M12 3v12.5" /><polyline points="7 11 12 16 17 11" /><path d="M4.5 17v2.5A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V17" /></>,
  payments:     <><circle cx="8.5" cy="9.5" r="5.5" /><circle cx="15.5" cy="14.5" r="5.5" /></>,
  notifications_active: <><path d="M7 17v-5.5a5 5 0 0 1 10 0V17l1.8 2H5.2L7 17Z" /><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0" /><path d="M4 6 2.5 4.5M20 6l1.5-1.5" /></>,
  bar_chart:    <><line x1="5" y1="20" x2="5" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="19" y1="20" x2="19" y2="14" /></>,
  church:       <><path d="M12 3v3M10.3 4.7h3.4" /><path d="M6 21V11l6-4.5 6 4.5v10Z" /><line x1="12" y1="13" x2="12" y2="21" /><line x1="9" y1="17" x2="15" y2="17" /><line x1="3.5" y1="21" x2="20.5" y2="21" /></>,
  savings:      <><path d="M4 12.5c0-4 3.4-7 8-7 3 0 5.3 1.3 6.6 3.3H20a1 1 0 0 1 1 1v2.3a1 1 0 0 1-1 1h-1.2" /><path d="M4 12.5v3.7A2.3 2.3 0 0 0 6.3 18.5H7v2M15 18.5v2" /><circle cx="9.3" cy="9.5" r=".9" fill="currentColor" stroke="none" /></>,
  edit:         <><path d="M4 20h4l10.5-10.5a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5V20Z" /><line x1="14" y1="7.5" x2="17.5" y2="11" /></>,
  delete:       <><path d="M5 7h14" /><path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" /><path d="M6.5 7l1 12.5A2 2 0 0 0 9.5 21.5h5a2 2 0 0 0 2-2L17.5 7" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>,
  add:          <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  image:        <><rect x="3" y="4.5" width="18" height="15" rx="2.3" /><circle cx="8.3" cy="9.5" r="1.6" /><path d="M4 17l5-5 3.5 3.5L16.5 12 20 15.5" /></>,
  save:         <><path d="M5 4h11l3 3v13H5V4Z" /><path d="M8 4v5h8V4" /><rect x="7.5" y="13" width="9" height="6" rx="0.8" /></>,
  cancel:       <><circle cx="12" cy="12" r="9" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></>,
  undo:         <><path d="M4 8v5h5" /><path d="M4.5 13A8 8 0 1 1 7 18.5" /></>,
  print:        <><path d="M6.5 9V4h11v5" /><rect x="3.5" y="9" width="17" height="7.5" rx="1.8" /><rect x="6.5" y="13.5" width="11" height="6.5" rx="1" /></>,
  inbox:        <><path d="M3.5 12h4.7l1.5 3h4.6l1.5-3h4.7" /><path d="M5 5.5h14L21 12v5.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V12L5 5.5Z" /></>,
  verified:     <><path d="M12 2.5l2.2 1.6 2.7-.2 1 2.5 2.3 1.4-.6 2.6.6 2.6-2.3 1.4-1 2.5-2.7-.2L12 18.2l-2.2-1.6-2.7.2-1-2.5-2.3-1.4.6-2.6-.6-2.6 2.3-1.4 1-2.5 2.7.2Z" /><polyline points="8.7 12 10.8 14 15.3 9.5" /></>,
  visibility:   <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  account_balance: <><line x1="4" y1="21" x2="20" y2="21" /><line x1="5.5" y1="10" x2="5.5" y2="18.5" /><line x1="10.5" y1="10" x2="10.5" y2="18.5" /><line x1="13.5" y1="10" x2="13.5" y2="18.5" /><line x1="18.5" y1="10" x2="18.5" y2="18.5" /><path d="M3 10l9-5.5L21 10Z" /></>,
  tag:          <><path d="M11.5 3.5H5.5A2 2 0 0 0 3.5 5.5v6L13 21l8-8L11.5 3.5Z" /><circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" /></>,
  info:         <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="7.7" r="0.9" fill="currentColor" stroke="none" /></>,
  open_in_new:  <><path d="M9.5 4.5h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" /><polyline points="14.5 3.5 20.5 3.5 20.5 9.5" /><line x1="20" y1="4" x2="11" y2="13" /></>,
  publish:      <><path d="M12 3v12" /><polyline points="7 8 12 3 17 8" /><path d="M4.5 15v3.5A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5V15" /></>,
  task_alt:     <><circle cx="12" cy="12" r="9" /><polyline points="8.3 12.3 10.7 14.7 15.7 9.5" /></>,
  apps:         <><circle cx="6" cy="6" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="6" r="1.6" fill="currentColor" stroke="none" /><circle cx="18" cy="6" r="1.6" fill="currentColor" stroke="none" /><circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="6" cy="18" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" /><circle cx="18" cy="18" r="1.6" fill="currentColor" stroke="none" /></>,
  circle:       <circle cx="12" cy="12" r="7" />,
  hourglass_empty: <><path d="M6 3h12" /><path d="M6 21h12" /><path d="M7 3v3.5c0 2 2 3.5 5 5.5-3 2-5 3.5-5 5.5V21" /><path d="M17 3v3.5c0 2-2 3.5-5 5.5 3 2 5 3.5 5 5.5V21" /></>,
};

/* Alias de íconos MD con equivalente ya existente (mismo glifo, otro
   nombre de Material Symbols) — evita duplicar paths casi idénticos. */
PATHS.person = PATHS.user;
PATHS.groups = PATHS.users;
PATHS.contacts = PATHS.users;
PATHS.favorite = PATHS.heart;
PATHS.favorite_border = PATHS.heart;
PATHS.email = PATHS.mail;
PATHS.location_on = PATHS.pin;
PATHS.photo_camera = PATHS.camera;
PATHS.schedule = PATHS.clock;
PATHS.calendar_month = PATHS.calendar;
PATHS.calendar_today = PATHS.calendar;
PATHS.event = PATHS.calendar;
PATHS.add_photo_alternate = PATHS.image;
PATHS.preview = PATHS.visibility;
PATHS.pending = PATHS.clock;
PATHS.visibility_off = <><path d="M2 12s3.6-7 10-7c1.5 0 2.9.3 4.1.9M22 12s-3.6 7-10 7c-1.5 0-2.9-.3-4.1-.9" /><path d="M9.5 9.7a3 3 0 0 0 4.2 4.2" /><line x1="3" y1="3" x2="21" y2="21" /></>;
PATHS.expand_more = <polyline points="5 9 12 15 19 9" />;
PATHS.arrow_back = <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></>;
PATHS.warning = <><path d="M12 3.5 22 20.5H2Z" /><line x1="12" y1="10" x2="12" y2="15" /><circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" /></>;
PATHS.check_circle = PATHS.task_alt;
PATHS.broken_image = <><rect x="3" y="4.5" width="18" height="15" rx="2.3" /><path d="M8 15.5 11 12l2 2.2L16.5 10 21 14.8" /><line x1="4" y1="20" x2="20" y2="4" /></>;
PATHS.mark_email_read = PATHS.task_alt;
PATHS.add_circle = <><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>;
PATHS.login = <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><polyline points="9 8 4.5 12 9 16" /><line x1="5" y1="12" x2="16" y2="12" /></>;
PATHS.man = PATHS.user;
PATHS.woman = PATHS.user;
PATHS.school = PATHS.book;
PATHS.child_care = PATHS.heart;
PATHS.admin_panel_settings = PATHS.settings;
PATHS.directions_run = PATHS.user;
PATHS.local_shipping = PATHS.box;
PATHS.music_video = PATHS.music;
PATHS.self_improvement = PATHS.pray;
PATHS.spatial_audio = PATHS.headphones;
PATHS.video_camera_front = PATHS.camera;
PATHS.waving_hand = PATHS.spark;
PATHS.play_circle = <><circle cx="12" cy="12" r="9" /><polygon points="10 8.3 16 12 10 15.7" fill="currentColor" stroke="none" /></>;
PATHS.shield = <path d="M12 3 4.5 6v6c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6Z" />;
PATHS.star = <polygon points="12 3 14.7 9.2 21.5 9.9 16.4 14.4 17.9 21 12 17.5 6.1 21 7.6 14.4 2.5 9.9 9.3 9.2" />;
PATHS.thumb_up = <><path d="M7 11v9H4.5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1H7Z" /><path d="M7 11l3.5-7a2 2 0 0 1 2 2v3.5H18a1.8 1.8 0 0 1 1.75 2.2l-1.4 6A2 2 0 0 1 16.4 20H9a2 2 0 0 1-2-2v-7Z" /></>;

export function Icon({ name, className = 'w-5 h-5', stroke = 1.6 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ---------- Soft halos (luz ambiental ESTÁTICA) ----------
   Sin animación a propósito: la guía prohíbe loops ("se leen como
   plantilla/IA") — antes pulsaban con haloPulse infinite. Son luz de
   ambiente detrás del cristal, no un elemento animado. */
export function Halos({ variant = 'hero' }) {
  if (variant === 'hero') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="halo" style={{ width: 640, height: 640, top: -180, right: -140, background: 'radial-gradient(circle, rgba(59,130,246,0.26), transparent 70%)' }} />
        <div className="halo" style={{ width: 520, height: 520, top: '30%', left: -160, background: 'radial-gradient(circle, rgba(96,165,250,0.18), transparent 70%)' }} />
        <div className="halo" style={{ width: 520, height: 380, bottom: -200, left: '35%', background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)' }} />
      </div>
    );
  }
  /* ⚠️ Hubo una variante "mesh" (lavado multicolor celeste/esmeralda/
     rosa/ámbar por esquinas, jul-2026) — ELIMINADA a pedido del usuario:
     "los gradientes se ven horribles, se nota que están hechos por IA".
     El ambiente del panel es monocromático (solo celeste), como el resto
     del sitio. No reintroducir fondos multicolor. */
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="halo" style={{ width: 480, height: 480, top: '10%', left: '-10%', background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)' }} />
      <div className="halo" style={{ width: 420, height: 420, bottom: '-10%', right: '-6%', background: 'radial-gradient(circle, rgba(96,165,250,0.12), transparent 70%)' }} />
      {/* Tercer halo, centrado y más ancho: las cards glass-light (blancas)
          necesitan brillo real detrás para no leerse grises — los dos
          halos de esquina no llegaban al centro de la grilla. Este es más
          grande y tenue, pensado para bañar el contenido, no para verse
          como un foco. */}
      <div className="halo" style={{ width: 900, height: 700, top: '5%', left: '25%', background: 'radial-gradient(ellipse, rgba(96,165,250,0.09), transparent 72%)' }} />
    </div>
  );
}

/* ---------- Squircle white card with whisper shadow ---------- */
export function Surface({ as: As = 'div', className = '', children, ...rest }) {
  return (
    <As className={`bg-bg border border-ink-soft shadow-card rounded-card ${className}`} {...rest}>
      {children}
    </As>
  );
}

/* ---------- Pill badge (chip) — sapphire tint ---------- */
export function Badge({ children, icon, className = '', tone = 'celeste' }) {
  const styles = tone === 'celeste'
    ? 'bg-celeste-soft text-celeste-hov'
    : 'bg-bg-soft text-ink';
  return (
    <span className={`inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-[12px] font-bold tracking-tightish ${styles} ${className}`}>
      {icon && <Icon name={icon} className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </span>
  );
}

/* ---------- Section eyebrow — pill de cristal: en liquid glass el
   material ES el acento, nada de colores planos ---------- */
export function Eyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-2.5 mb-4 px-4 py-1.5 rounded-full liquid-glass text-white/90 text-[12.5px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      {children}
    </div>
  );
}

/* ---------- Pill button (lenguaje actual del sitio) ----------
   Antes: relleno bg-celeste plano + rounded-sm — sobreviviente del
   sistema S9 viejo, se leía "botón genérico de IA". La guía es clara:
   el material ES el acento, nada de colores planos. El primario del
   sitio es el pill BLANCO (como en el hero/Login), el secundario es
   cristal con borde. */
export const GlassButton = forwardRef(function GlassButton(
  { children, variant = 'primary', icon, className = '', as: As = 'button', ...props },
  ref,
) {
  const base = 'group inline-flex items-center justify-center gap-2 rounded-pill font-bold tracking-tightish btn-spring select-none cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    // Primario — pill blanco sobre navy (el CTA estándar del sitio)
    primary: 'px-6 py-3.5 text-[15px] text-bg bg-white shadow-card hover:shadow-card-lg',
    // Cristal — vidrio con borde, texto blanco
    glass:   'px-6 py-3.5 text-[15px] text-white liquid-glass border border-white/20 hover:border-white/40',
    // Ghost — mínimo
    ghost:   'px-5 py-2.5 text-[14px] text-white/60 hover:text-white hover:bg-white/5',
  };
  return (
    <As ref={ref} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
      {icon && <Icon name={icon} className="w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-0.5" stroke={2} />}
    </As>
  );
});

/* ---------- Campo de formulario público (sobre cristal/navy) ----------
   Para páginas públicas (auth, formularios sobre .liquid-glass). El
   Input de ui/Input.jsx es Material Design 3 y es EXCLUSIVO del panel
   admin — no mezclarlo en el público (docs/DISENO_LIQUID_GLASS.md §1). */
const glassFieldStyle = {
  background: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.12)',
  color: '#fff',
};

export function GlassField({ label, error, className = '', ...props }) {
  return (
    <label className="block text-left">
      {label && <span className="block text-[13px] font-semibold text-white/60 mb-2">{label}</span>}
      <input className={`input-squircle ${className}`} style={glassFieldStyle} {...props} />
      {error && <span className="block text-[12.5px] font-medium text-red-400 mt-1.5">{error}</span>}
    </label>
  );
}

/* ---------- Form field (input/select/textarea) ---------- */
export function Field({ label, type = 'text', name, value, onChange, error, placeholder, as = 'input', children, ...rest }) {
  const cls = `input-squircle ${error ? '!border-rose' : ''}`;
  return (
    <label className="block">
      <span className="block mb-2 text-[12.5px] font-bold tracking-tightish text-ink-2">{label}</span>
      {as === 'select' ? (
        <select name={name} value={value} onChange={onChange} className={`${cls} appearance-none cursor-pointer pr-10`} {...rest}>
          {children}
        </select>
      ) : as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} className={`${cls} resize-none`} {...rest} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={cls} {...rest} />
      )}
      {error && <span className="mt-1.5 block text-[12.5px] text-rose font-bold">{error}</span>}
    </label>
  );
}
