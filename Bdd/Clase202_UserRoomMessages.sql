USE `mydb`;

insert into User(username, password) values("Primer_Usuario", "1234");

select * from User;

insert into Rooms(name) values("La sala numero 1");

select * from Rooms;

insert into Message(userid, Romsid, text, createDate) values(1,1,"El primer mensaje del mundo jijija", now());

select * from Message;

insert into User(username, password) values("Segundo_Usuario", "1234");
insert into User(username, password) values("Tercer_Usuario", "1234");

select * from User;

insert into Rooms(name) values("La sala 2");

insert into Message(userid , Romsid, text, createDate) values(2,1,"El segundo mensaje mundo jijija", now());
insert into Message(userid , Romsid, text, createDate) values(1,1,"jajaa eres el segundo", now());

select * from Message;

select * from Messages where userid = 1;
select * from Messages where Roomsld = 1;


select User.username, text, createDate from Message
inner join User on Message.userid = User.id
where Romsid = 1;

select User.username from Message
inner join User on Messages.userid = User.id
where Romsid = 1
group by userid;

-- Asi creamos las funciones
USE `mydb`;

create procedure GetUsersInRoom
(Romsid int)

select userid, user.username from Message
inner join User on Message.userid = User.id
where Romsid = Romsid
group by userid;

call GetUsersInRoom(1);

call createUser("User creado desde Procedure", "7777";