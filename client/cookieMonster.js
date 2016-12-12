var webDir = location.href.split("/");

//var script = document.createElement('script');
//script.src = "https://jsconsole.com/js/remote.js?hillworldenterprise";
//document.body.appendChild(script);

function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

function logout() {
    eraseCookie("name");
    eraseCookie("publicKey");
    eraseCookie("id");
    if (webDir[3] == "portal") {
        location.href = "/";
    }
}

if (document.cookie) {
    var name = readCookie("name");
    var id = readCookie("id")
    var publicKey = readCookie("publicKey");
    var socket = io.connect();
    socket.on('connect', function() {
        socket.emit("check", id + ";" + publicKey);
    });
    socket.on('test', function(data) {
        console.log(data);
    });
    socket.on(id.toString(), function(data) {
        if (data == "true") {
            if (webDir[3] != "portal") {
                location.href = "/portal";
            }
        } else {
            logout();
        }
    });
} else {
    logout();
}
if (webDir[4] == "worldmail") {
    function getMail(action) {
        $("#sendbutton").show();
        $("#sendmail").hide();
        $("#getmail").show();
        $.ajax({
            method: "GET",
            url: "/user/worldmail/" + action,
            success: function (data) {
                if (action == "inbox") {
                    $("#inbox").addClass("active");
                    $("#outbox").removeClass("active");
                    var table = $("#mail");
                    $(table.find("th")[0]).text("From:");
                    table.find("td").remove();
                    $.each(data, function (index, value) {
                        var tr = document.createElement("tr");
                        $(tr).append($(document.createElement("td")).append(document.createTextNode(value.fromName)));
                        $(tr).append($(document.createElement("td")).append(document.createTextNode(value.subject)));
                        $(table).append(tr);
                    });
                } else if (action == "outbox") {
                    $("#outbox").addClass("active");
                    $("#inbox").removeClass("active");
                    var table = $("#mail");
                    $(table.find("th")[0]).text("To:");
                    table.find("td").remove();
                    $.each(data, function (index, value) {
                        var tr = document.createElement("tr");
                        $(tr).append($(document.createElement("td")).append(document.createTextNode(value.toName)));
                        $(tr).append($(document.createElement("td")).append(document.createTextNode(value.subject)));
                        $(table).append(tr);
                    });
                } else {
                    console.log("ERROR");
                }
            }
        });
    }
    function sendMail() {
        $("#sendbutton").hide();
        $("#getmail").hide();
        $("#sendmail").show();
    }
}