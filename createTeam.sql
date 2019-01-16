create table team
(
  id         uuid      not null
    constraint team_pk
      primary key,
  coach_id uuid not null,
  name       varchar(64)  not null,
  offer  integer
);

create table team_users
(
  team_id uuid not null,
  user_id uuid not null,
  primary key(team_id, user_id)
);

create table team_codes
(
  team_id uuid not null,
  code varchar(5) not null,
  is_used boolean not null default false,
  primary key(team_id, code)
)

create unique index team_id_uindex
  on team (id);

create unique index team_name_uindex
  on team (name);
