-- Enrollment email + subject support
alter table public.enrollments
add column if not exists subject text not null default 'DELE A2 REVIEW COURSE';

alter table public.enrollments
add column if not exists admin_notified boolean default false;
