function toHoursAndMinutes(totalSeconds) {
  const totalMinutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { h: hours, m: minutes, s: seconds };
}

function update_machine_status(machine_name){


    var route = "/get_latest_log_img/"+machine_name
    $.ajax({
            url: route,
            type: "GET",
            success: function(response) {

                d = new Date();
                $("#image_1").attr("src",response["log_image"]+"?"+d.getTime())
                $("#backend_log").attr("href",response["log_link"]+"?"+d.getTime())
                $("#last_log_date").html(response["last_log_date"]);

                if(response["machine_status"]["online"]==true){
                    $("#power_button").css("color","green");
                    $("#online_status").css("color","green");
                    $("#online_status").html("online");

                    var current_stp_str = "<h4 style='text-align: center;font-size:1em;'>Current step: " + response["machine_status"]["current_step"] +"</h4>"

                    $("#current_step").html(current_stp_str);
                    $("#current_step").show();
                }
                else {
                    $("#power_button").css("color","lightgray");
                    $("#online_status").html("offline");
                    $("#online_status").css("color","lightgray");

                }
                var tmp_time = toHoursAndMinutes(parseInt(response["machine_status"]["etch_time_left"]))

                if(!isNaN(tmp_time["h"]) && response["machine_status"]["etch_time_left"]!="0"){
                    var etch_str = "<h4 style='text-align: center;font-size:1em;'>Etch time left: " + tmp_time["h"] + " hrs : " + tmp_time["m"] + " minutes : " + tmp_time["s"] +" seconds</h4>"
                    $("#etch_time_left").empty()
                    $("#etch_time_left").append(etch_str)
                    $("#etch_time_left").show()
                }
                else {
                    $("#etch_time_left").hide()

                }
            }
        });

        setTimeout(() => {
          update_machine_status(machine_name)
      }, "10000");
}
var passwords_dict = {"default":"default","naiad_1":"4074","naiad_2":"4139","naiad_3":"8658","naiad_4":"5242","naiad_5":"9507","naiad_6":"1899","naiad_7":"4473"}
