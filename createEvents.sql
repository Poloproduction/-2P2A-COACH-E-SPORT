create table event_types
(
	event_type_id uuid not null
		constraint event_types_pk
			primary key,
	event_type_label varchar(64),
	event_color varchar(10)
);

create table events
(
	event_id uuid not null
		constraint events_pk
			primary key,
	team_id uuid not null
		constraint events_team_team_id_fk
			references team (id),
	event_type_id uuid not null
		constraint events_event_types_event_type_id_fk
			references event_types (event_type_id),
	event_date timestamp not null,
	text text not null
);

insert into event_types (event_type_id, event_type_label, event_color) values ('a4968bef-500f-49ef-9bc9-87f1fe4cc90f', 'Competition', 'red');
insert into event_types (event_type_id, event_type_label, event_color) values ('eb35abcc-f27f-468f-b781-3cf5ad48419f', 'Training', 'orange');
insert into event_types (event_type_id, event_type_label, event_color) values ('c6bc7928-d985-45d1-9628-3e360a41e511', 'Meeting', 'green');