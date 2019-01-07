create table users
(
  id        uuid      not null
    constraint users_pkey
      primary key,
  firstname varchar(64),
  lastname  varchar(64),
  email     varchar(128) not null,
  password  varchar(60),
  birthday  date,
  iam       varchar(64) default 'Amateur'::bpchar,
  pseudo    varchar(64),
  city      varchar(64),
  weapon    varchar(64)
);

create unique index users_email_uindex
  on users (email);
