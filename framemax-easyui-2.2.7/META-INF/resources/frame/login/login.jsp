<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" trimDirectiveWhitespaces="true"%>
<%@ page import="org.springframework.util.StringUtils" %>
<%@ page import="cn.com.yict.framemax.core.config.Config" %>
<%@ page import="cn.com.yict.framemax.web.utils.PathUtils" %>
<%String resetPasswordPageUrl = Config.get("framemax-security.resetPasswordPageUrl"); %>
<%String logo = Config.get("web.loginPageLogoImagePath"); %>
<%String topLogo = Config.get("web.loginPageTopLogoImagePath"); %>
<%boolean templogin = "true".equals(Config.get("templogin.enable")); %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<script type="text/javascript" src="${pageContext.request.contextPath }/easyui/plugins/json/json2.min.js" ></script>
<script type="text/javascript" src="${pageContext.request.contextPath }/frame/login/js/store.min.js"></script>
<script type="text/javascript">
store.set('targetUrl',decodeURIComponent("${param[applicationScope.config['framemax-security.returnUrlParamName']]}"));
if(window.location.href != top.window.location.href){
	top.window.location.href=window.location.pathname;
}
</script>
<title>${applicationScope.config['sys.applicationName']}</title>
<link rel="stylesheet" type="text/css" href="${pageContext.request.contextPath }/frame/login/css/stylesheet.css?v=3" />
<%if(templogin) {%>
<link rel="stylesheet" type="text/css" href="${pageContext.request.contextPath }/frame/login/dialog/css/flat/zebra_dialog.min.css" />
<%} %>    
</head>
<body>
    <div id="container" class="wrapper">
        <div class="wrapperin">
            <div class="userlogo">
                <div class="img">
                    <table>
                        <tr>
                            <td rowSpan="2"><img src="<%=PathUtils.getLinkPath(request.getContextPath(), topLogo) %>" alt="" class="logoimg" /></td>
                            <!-- <td><span class="cname" style="margin-left:100px" >${applicationScope.config['sys.applicationName']}</span></td> -->
                        </tr>
                        <tr>
							<!-- 
                            <td><span class="ename" style="margin-left:100px" >${applicationScope.config['sys.applicationEnName']}</span></td>-->
							<td rowSpan="2" style="position: relative;"><span class="cname" style="margin-left:100px;position: absolute;bottom: 4px;left: 0;width: 240px;" >${applicationScope.config['sys.applicationName']}</span></td>
                        </tr>
                    </table>

                </div>
            </div>
            <div id="content">
                <div class="box">
                    <span class="bg"></span>
                    <div class="content" style="position: relative;">
                        <img src="<%=PathUtils.getLinkPath(request.getContextPath(), logo) %>" alt="" class="loginimg" style="position: absolute;left: 85px;top: 45px;"/>
                        <div class="loginright">
                            <div class="warningcon">
                                <span class="warning" style="visibility: hidden;">Please enter a username and password</span>
                            </div>                        	
                            <form action="${pageContext.request.contextPath }${applicationScope.config['framemax-security.loginProcessUrl']}"
                                checkurl="${pageContext.request.contextPath }/rest/fmxUserRest/checkUser.json"
                                method="post" id="loginForm" errmsg="Invalid user name and password">
								<input type="hidden" name="password" id="txtPwd"/>
								<input type="hidden" name="key" id="txtKey" />                                
                                <table class="userform" style="position: relative;width: auto;left: 0;top: 0;">
                                    <tr>
                                    	<td align="right">Login Name：</td>
                                        <td align="left"><input type="text" name="username" placeholder="Enter a username" class="input" nullmsg="Please enter a username!" /></td>
                                    </tr>
                                    <tr>
                                    	<td align="right">Password：</td>
                                        <td align="left"><input type="password" id="password" placeholder="Enter a password" class="input" nullmsg="Please enter a password!" /></td>
                                    </tr>
                                    <% if(cn.com.yict.framemax.core.context.Context.get().getApplicationContext().containsBean("framemax-common.KaptchaBean")) {%>
                                    <tr>
                                        <td style="text-align: left;">Verification Code：</td> 
                                        <td align="left"><input type="text" id="checkCode" placeholder="Enter a verification code" value=""
                                            class="input checkCode" nullmsg="Please enter a verification code!" errmsg="Vrification code error!" />
                                        <span
                                            class="code" id="code"> <img style="height:30px;"
                                                src="${pageContext.request.contextPath }${applicationScope.config['framemax-common.kaptcha.CodeUrl']}"
                                                checkurl="${pageContext.request.contextPath }${applicationScope.config['framemax-common.kaptcha.CodeCheckUrl']}"
                                                class="code_class" alt="" /></span></td>
                                    </tr>
                                    <%} %>
                                    <tr>
                                    	<td></td>
                                        <td style="text-align: left;"><a href="#" class="button" id="but_login"><span id="sub">Login</span> </a></td>
                                    </tr>
                                    <tr>
                                    	<td align="right" colspan="2">
                                        <div style="font-size: 14px;">
                                    	<%if(templogin) {%>
                                    	 <a href="#" onclick="tempLogin.openTempLoginDialog();"><%=Config.get("templogin.buttonText")%></a>
                                    	 <span style="width: 12px;display: inline-block;">&nbsp;</span>
                                    	<%}%>
                                    	<% if(!StringUtils.isEmpty(resetPasswordPageUrl)) {%>
                                    	<a href="${pageContext.request.contextPath}${resetPasswordPageUrl}">Forget password</a>
                                    	<%} %>
                                         <span style="width: 17px;display: inline-block;margin-right: 0;">&nbsp;</span>
                                        <span class="version" style="margin-right: 0;">${applicationScope.config['web.loginPageVerInfo'] }</span>
                                        </div>
                                        </td>
                                    </tr>
                                </table>
                            </form>
                        </div>
                   	</div>
                </div>
                <div class="copyright">
                    <span>${applicationScope.config['web.loginPageCopyRightInfo'] }</span>
                </div>

            </div>
        </div>
    </div>
    <!-- Link JScript-->
    <script type="text/javascript" src="${pageContext.request.contextPath }/easyui/jquery-easyui-1.5/jquery.min.js"></script>
    <script type="text/javascript" src="${pageContext.request.contextPath }/frame/js/Base64.js"></script>
    <script type="text/javascript" src="${pageContext.request.contextPath }/frame/login/js/login.js?v=1"></script>
<%if(templogin) {%>
	<script type="text/javascript" src="${pageContext.request.contextPath }/frame/login/dialog/zebra_dialog.min.js"></script>
	<script id="dlgTempLogin" type="text/template">
		<form id="formTempLogin" action="${pageContext.request.contextPath }${applicationScope.config['framemax-security.loginProcessUrl']}" method="POST">
		<table class="userform" style="position:inherit;">
             <tr>
             	<td style="text-align: right;width:95px;">Phone number：</td>
                <td align="left" colspan="2"><input type="text" id="phone" name="username" placeholder="Please enter a phone number" class="input" /></td>
             </tr>
             <tr>
             	<td style="text-align: right;">Verification Code：</td>
                <td align="left" style="width:120px"><input type="text" id="validatecode" name="password" class="input" style="width:80px;" /></td>
                <td align="left"><div class="ZebraDialog_Buttons" id="ctCodeInfo"><a id="btnGetCode" href="#" style="float:left;">Get a verification code</a></div></td>
             </tr>
        </table>
		<input type="hidden" value="true" name="templogin"/>
        </form>
        <div id="templogin_msg" class="warning" style="color:red;">&nbsp;</div>
	</script>
	<script type="text/javascript">
	var TempLogin = function(){
		var sendUrl="${pageContext.request.contextPath }/rest/fmxTemploginRest/sendCode.json",
		    checkUrl="${pageContext.request.contextPath }/rest/fmxTemploginRest/checkCode.json",
		    $btnGetCode=0,$msg=0,$ctCodeInfo=0,interval=0,ticket=0;
		function getPhoneNum() {
			var $phone = $("#phone"),phone = $phone.val();
			if(!phone){
				$msg.text($phone.attr('placeholder'));
				$phone.focus();
				return false;
			}
			return phone;
		}
		
		function doPost(url,data,cb){
			$.post(url,data,cb,"json");
		}
		
		function showCodeIntervalMsg() {
			if(interval == 0) {
				$ctCodeInfo.empty().append($btnGetCode);
				return;
			}
			var msg = "Please retrieve in "+interval+" seconds";
			$ctCodeInfo.text(msg);
			interval = interval-1;
			ticket = setTimeout(showCodeIntervalMsg,1000);
		}
		
		function sendCode() {
			var phone = getPhoneNum();
			if(phone){
				doPost(sendUrl,{phone:phone},function(result){
					if(result.code < 0) {
					   $msg.text(result.message);
					}else{
						interval=60;
						$btnGetCode.detach();
						 $msg.html("&nbsp;");
						showCodeIntervalMsg();
					}
				});
			}
		}
		
		function login() {
			var phone = getPhoneNum();
			if(!phone){
				return;
			}
			var code = $("#validatecode").val();
			if(!code) {
				$msg.text("Please enter a verification code!");
				$("#validatecode").focus();
				return;
			}
			doPost(checkUrl,{phone:phone,code:code},function(ret) {
				if(ret.code == 0) {
					$("#formTempLogin").submit();
				}else{
					$msg.text(ret.message);
				}
			});
		}
		
		function openTempLoginDialog() {
			interval=0;
			var ret = $.Zebra_Dialog({
				source:{inline:$("#dlgTempLogin").html()},
				title:'<%=Config.get("templogin.buttonText")%>',
				overlay_close:false,
				type:null,
				onClose:function(){
					if(ticket){
						clearTimeout(ticket);
					}
				},
				buttons:[{
					caption:"close"
				},{
					caption:"Login in",
					callback:function(){
						login();
						return false;
					}					
				}]
			});
			$btnGetCode=$("#btnGetCode",ret.dialog).click(sendCode);
			$msg=$("#templogin_msg",ret.dialog);
			$ctCodeInfo=$("#ctCodeInfo",ret.dialog);
			
		}
		
		this.openTempLoginDialog = openTempLoginDialog;
	}
	var tempLogin = new TempLogin();
	</script>
<%} %>    
</body>
</html>