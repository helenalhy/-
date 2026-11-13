--
-- PostgreSQL database dump
--

\restrict YkNaORmeleXN58Y3I2928eLch85oyDPetCt6ia2h1oHv5Uwk9viv9Cbpqe92MTX

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: push_reminder_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_reminder_subscriptions (
    endpoint_hash text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    reminder_time text NOT NULL,
    time_zone text NOT NULL,
    last_sent_local_date text,
    last_check_in_local_date text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reminder_times jsonb DEFAULT '[]'::jsonb NOT NULL,
    last_sent_local_dates jsonb DEFAULT '{}'::jsonb NOT NULL,
    habit_reminders jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.push_reminder_subscriptions OWNER TO postgres;

--
-- Name: push_vapid_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_vapid_config (
    id text NOT NULL,
    public_key text NOT NULL,
    encrypted_private_key text NOT NULL,
    iv text NOT NULL,
    auth_tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.push_vapid_config OWNER TO postgres;

--
-- Name: user_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_progress (
    user_id text NOT NULL,
    snapshot jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_progress OWNER TO postgres;

--
-- Data for Name: push_reminder_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.push_reminder_subscriptions (endpoint_hash, endpoint, p256dh, auth, reminder_time, time_zone, last_sent_local_date, last_check_in_local_date, created_at, updated_at, reminder_times, last_sent_local_dates, habit_reminders) FROM stdin;
\.


--
-- Data for Name: push_vapid_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.push_vapid_config (id, public_key, encrypted_private_key, iv, auth_tag, created_at) FROM stdin;
momentum-web-push-v1	BKO9DNcCWLh3Zq77YpoC6r17d4SY1NuPGMKsKDM38EH0muNSyg-NVAaeaye9eHsRB83kRgefB21gFIFpBYSnuKs	6coWo1WxILOtjSpODPqvYsS7Z+aux/+adLIVjtQ7xlFgx9yCnjDv3/PStA==	fMydGJkSe6j28BHL	aHalbvRiZwCGXAJ/k1zuEA==	2026-11-03 02:26:29.585215+00
\.


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_progress (user_id, snapshot, updated_at) FROM stdin;
user_3M2GPHHnRERQQa0pl3zsSEbbFfZ	{"mall": {"coins": 5, "leaveCards": 0, "placements": {}, "rewardTokens": {"shop": 0, "decor": 0, "facility": 0}, "schemaVersion": 6, "shopInteriors": {}, "purchasedItems": [], "dailyLoginStreak": 1, "rewardedCheckIns": [], "dailyLoginLastDate": "2026-11-13", "protectedStreakDates": [], "dailyLoginLastPrizeItemId": null, "weeklyChallengeRewardPlans": {}, "weeklyChallengeRewardedWeeks": []}, "habits": [{"id": "starter-walk", "icon": "activity", "color": "#D5F2DF", "steps": [], "title": "散步 20 分鐘", "reason": "讓身體和心情都透透氣", "checkIns": [], "restDays": [], "createdAt": "2026-01-01", "stepCheckIns": {}, "makeupCheckIns": [], "rewardCategory": "facility"}, {"id": "starter-read", "icon": "book-open", "color": "#E8DDF9", "steps": [], "title": "閱讀 10 頁", "reason": "每天留一點時間給自己", "checkIns": [], "restDays": [], "createdAt": "2026-01-01", "stepCheckIns": {}, "makeupCheckIns": [], "rewardCategory": "shop"}, {"id": "starter-water", "icon": "edit-3", "color": "#FFE1EC", "steps": [], "title": "寫下今天的一件好事", "reason": "看見已經擁有的進步", "checkIns": [], "restDays": [], "createdAt": "2026-01-01", "stepCheckIns": {}, "makeupCheckIns": [], "rewardCategory": "decor"}, {"id": "1794541330088-zwmcmeh", "icon": "activity", "color": "#D5F2DF", "steps": [], "title": "Sync persistence IRhfA-", "reason": "Synthetic account cloud-sync verification", "checkIns": [], "restDays": [], "createdAt": "2026-11-13", "stepCheckIns": {}, "makeupCheckIns": [], "rewardCategory": "facility"}], "profile": {"avatarId": "sun", "nickname": ""}, "schemaVersion": 1}	2026-11-13 03:42:37.775+00
\.


--
-- Name: push_reminder_subscriptions push_reminder_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_reminder_subscriptions
    ADD CONSTRAINT push_reminder_subscriptions_pkey PRIMARY KEY (endpoint_hash);


--
-- Name: push_vapid_config push_vapid_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_vapid_config
    ADD CONSTRAINT push_vapid_config_pkey PRIMARY KEY (id);


--
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict YkNaORmeleXN58Y3I2928eLch85oyDPetCt6ia2h1oHv5Uwk9viv9Cbpqe92MTX

