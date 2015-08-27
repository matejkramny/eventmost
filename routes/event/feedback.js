var models = require('../../models')

exports.router = function (app) {
	app.get('/sendnewsletter', sendnewsletter)
}

function sendnewsletter (req, res) {
	console.log("hi newsletter");
	var email = "haseebkhilji@gmail.com";
	var htmlcontent = '
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Untitled Document</title>
</head>

<body style="font-family:Arial, Helvetica, sans-serif">
<table width="700" border="0" cellspacing="0" cellpadding="0" bgcolor="#F7F7F7" align="center" style="padding:5px 0px">
  <tr>
    <td>
    	<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td><img src="http://dev.eventmost.com/images/logo.svg" style="text-align:center ; margin:0px auto;  display:block; margin-bottom:10px " /></td>
  </tr>
  <tr>
    <td>
    	<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td bgcolor="#0992A3" style="padding:10px 10px 10px 10px; font-size:22px; color:#FFFFFF">SSCG Africa Annual Economic & Entrepreneurship  Conference</td>
  </tr>
  <tr>
    <td style="padding:10px 10px 10px 10px; font-size:16px; color:#000"><p><img src="2.jpeg" style="padding:0px 15px 10px 0px; float:left" width="150" />Join us on 10 -11 June 2015 at The SSCG  Africa Annual Economic & Entrepreneurship  Conference, Oxford where more than 300 industry experts, business leaders, entrepreneurs, investors and officials will gather to explore how the business communities across Africa are meeting market challenges, creating growth opportunities and transforming their ec . . .</p></td>
  </tr>
  
  <tr>
    <td style="padding:10px 10px 10px 10px; font-size:20px; color:#FED298; text-align:center"><p>Dear Speaker, We have selected following questions for you to send a reply if you want.</p></td>
  </tr>
  <tr>
    <td>
    	<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td >
    <div style="float:left; width:100%; margin-bottom:10px;" >
    	<div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;">
        	<div style="float:left; margin-right:15px;"><img src="3.jpeg"  width="100" height="100" style="border-radius:110px " /></div>
            <div style=" float:left ; margin:20px 0px 0px 20px">
            	<div class="font20a nspacer font-exception" style=" font-weight:bold">Haseeb</div>
                <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >Attendee</div></div>
                <div class="bold break font-change font-attendee font-exception"> Developer</div>
            </div>
        </div>
        
        <div style=" margin-top:10px;">This is a test question for speaker?</div>
        <div style=" margin-top:10px"><a href="#" style="color:#0992A3; font-weight:bold"><img src="reply.png" style="padding-right:10px "  width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div>
    </div>
        
        <div style="float:left; width:100%; margin-bottom:10px;" >
    	<div style=" background:#E6E7E8; margin-left:10px; width:32%; float:left; padding:0px 10px 0px 0px;border-radius:110px; margin-bottom:10px; margin-right:10px;">
        	<div style="float:left; margin-right:15px;"><img src="1.jpeg"  width="100" height="100" style="border-radius:110px " /></div>
            <div style=" float:left ; margin:20px 0px 0px 10px">
            	<div class="font20a nspacer font-exception" style=" font-weight:bold">m string</div>
                <div style="float:left; font-weight:bold"><div class="font20a nspacer font-exception" >Attendee</div></div>
                <div class="bold break font-change font-attendee font-exception"><br />Big Company</div>
            </div>
        </div>
        
        <div style=" margin-top:10px;">This is a another test question for speaker?</div>
        <div style=" margin-top:10px"><a href="#" style="color:#0992A3; font-weight:bold"><img src="reply.png" style="padding-right:10px "  width="40" align="left"/> <div style="margin:10px 0px 0px 0px; float:left">Reply</div></a></div>
    </div>
       
        
    </td>
  </tr>
</table>


    </td>
  </tr>
</table>

    </td>
  </tr>
  <tr bgcolor="#542437">
    <td style="color:#FFFFFF; padding:20px 10px;font-size:14px; text-align:center">Copyright &copy; 2015 <b>EventMost</b> | <a style=" color:#FFFFFF; text-decoration:none; " href="/contact">Contact us</a></td>
  </tr>
</table>

    </td>
  </tr>
</table>

</body>
</html>';

	var options = {
			from: "EventMost <noreply@eventmost.com>",
			to: " <"+email+">",
			subject: "Feedback Newsletter ",
			html: htmlcontent
		}


	config.transport.sendMail(options, function(err, response) {
			if (err) throw err;
			
			console.log("Email sent.."+response.message)
			res.format({
				json: function() {
					res.send({
						status: 200,
						message: "email sent"
					})
				}
			})
		})
	
}

