<%@ page language="java" contentType="text/html; charset=UTF-8" trimDirectiveWhitespaces="true" pageEncoding="UTF-8"%>
<%@ page import="cn.com.yict.framemax.core.context.Context" %>
<%@ page import="cn.com.yict.framemax.core.config.Config" %>
<%@ page import="org.springframework.util.StringUtils" %>
<%@ page import="cn.com.yict.framemax.web.utils.PathUtils" %>
<% request.setAttribute("userInfo",Context.get().getCurrentUser()); %>
<%String logo1 = Config.get("web.homePageLogo1ImagePath"); %>
<%String logo2 = Config.get("web.homePageLogo2ImagePath"); %>
<!DOCTYPE html>
<html>

<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta charset="UTF-8">
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<title>${applicationScope.config['sys.applicationName']}</title>
	<%-- <link rel="stylesheet" href="${pageContext.request.contextPath}/frame/index/css/common.css"> --%>
	<link rel="stylesheet" href="${pageContext.request.contextPath}/frame/index/css/index.css?v=5">
	<script type="text/javascript" src="${pageContext.request.contextPath}/pageContext.js?deps=message"></script>
	<script type="text/javascript" src="${pageContext.request.contextPath}/frame/index/js/index.js?v=2"></script>
</head>

<body class="easyui-layout">
		<div region="north" style="overflow:hidden;">
			<div class="part_one">
				<header class="clearfloat">
					<%if(!StringUtils.isEmpty(logo1)){ %>
					<a class="float_l" style="display: block;height:100%;" href="#"><img style="max-width: 150px;max-height:50px;display: block;" class="" src="<%=PathUtils.getLinkPath(request.getContextPath(), logo1)%>"></a>
					<%} %>
					<h1 class="YCAF_box float_l" style="font-weight: normal;">${applicationScope.config['sys.applicationName']}</h1>
					<% if(!StringUtils.isEmpty(logo2)){%>
					<img class="float_r" style="max-width: 150px;max-height:50px;" src="<%=PathUtils.getLinkPath(request.getContextPath(), logo2)%>">
					<%} %>
				</header>
				<nav class="clearfloat">
					<ul class="clearfloat float_l" id="topMenuBar"></ul>
					<div class="float_r personal_box">
						<img class="float_l personal" src="${pageContext.request.contextPath}/frame/index/image/personal_btn.png">
						<div class="float_l personal_color"><span class="user" onclick="changPwd()">${requestScope.userInfo.userAccount}</span></div>
						<div class="personal_color float_r">|<span class="sign_out"><a id="logoutLink" href="<%=cn.com.yict.framemax.security.utils.SecurityUtils.getLogoutUrl(request)%>">Sign out</a></span></div>
					</div>
				</nav>
			</div>
		</div>
		<div region="west" title=" " style="width:250px;background-color: #e6e8eb;" id="leftMenuBar" split="true">
		</div>
		<div region="center" style="border-left:none;">
			<div id="tabPages" class="easyui-tabs" style="overflow: hidden;" fit="true" border="false" plain="true">
			</div>
		</div>
	<div region="south">
		<div class="footer_cont clearfloat" style="overflow: hidden;">
			${applicationScope.config['web.homePageCopyRightInfo'] }
		</div>
	</div>
	<div id="dlgChangPwd" class="fitem easyui-dialog" data-options="onClose:onDlgChangePwdClose" style="display:none" closed="true" buttons="#dlg-buttons">
		<form id="fmPwd" method="post" class="frmContent" data-options="maskit:'dlg-buttons',novalidate:true">
			<table>
				<tr>
					<td><label>Original password: </label></td>
					<td><input id="oldPassword" name="oldPassword" type="password" class="easyui-textbox" data-options="required:true" maxlength="50" style="width:90%;"></td>
				</tr>
				<tr>
					<td><label>New password: </label></td>
					<td><input id="newPassword" name="newPassword" type="password" class="easyui-textbox" data-options="required:true" maxlength="50" data-options="required:true" style="width:90%;"></td>
				</tr>
				<tr>
					<td><label>Confirm password: </label></td>
					<td><input id="ePasswordRe" type="password" class="easyui-textbox" data-options="required:true" maxlength="50" data-options="required:true" validType="eqPassword[document.getElementById('newPassword').value]" style="width:90%;"></td>
				</tr>
			</table>
		</form>
	</div>
	<div id="dlg-buttons">
		<a href="#" class="easyui-linkbutton" onclick="savePwd()" default>Save</a>
		<a href="#" class="easyui-linkbutton" onclick="javascript:$('#dlgChangPwd').dialog('close')">Cancel</a>
	</div>
	<!-- Tab右键功能菜单初始化 -->
	<div id="tabCtxMenu" class="easyui-menu" style="width:150px;display:none">
		<div act="refresh">Refresh</div>
		<div class="menu-sep"></div>
		<div act="close">Close</div>
		<div act="closeAll">Close All</div>
		<!-- 除此之外全部关闭 -->
		<div act="closeOther">Close Others</div>
		<!-- <div class="menu-sep"></div>
		<div act="closeRight">当前页右侧全部关闭</div>
		<div act="closeLeft">当前页左侧全部关闭</div> -->
	</div>	
</body>
<script type="text/javascript">
	var paramRemark="";
	var paramValue="";
	$(document).ready(function(){
		$.extend($.fn.validatebox.defaults.rules, {   
			eqPassword : { validator : function(value,param) {  
				return value==param[0];   
				},   
				message : 'Inconsistent passwords'   
			}   
		});
		$.post($url('/rest/fmxUserRest/passwordExpire.json'), {

			}, function(result) {
				if (result.data < 0) {
					var opts = {
							title:"Tips",
							// 当前密码已过期，请修改密码！
							msg:"The current password has expired, please modify the password!",
							icon:"warning",
							onClose:function(){
								changPwd(true);
							}
					}
					$.messager.alert(opts);
				}
			}, 'json'); 
		$.post($url('/rest/fmxParamConfigRest/getParamConfigByCode.json'), {
			paramCode : "password.validation"
			}, function(result) {
				if (result.code == 0) {
					paramRemark=result.data.paramRemark;
					paramValue=result.data.paramValue;
				}
			},
		'json');
		$.extend(true,$("#newPassword").textbox("options").rules, {   
			passwordValidate : { validator : function(value) {
				var flag=value.match(paramValue);
				if(flag!=null)return true; 
				$("#newPassword").textbox("options").rules.passwordValidate.message=paramRemark;
			}}   
		});
	})

	function onDlgChangePwdClose() {
		var focus = $('#dlgChangPwd').data("focus");
		if(focus){//密码到期后,如果不修改密码,则强制退出登录
			var link = $("#logoutLink").attr('href');
			window.location.href=link;
		}
	}
	
	function changPwd(focus){
		if(pageContext.templogin){
			return;
		}
		$('#dlgChangPwd').data("focus",focus).dialog('open').dialog('setTitle','Tips');
		$("#fmPwd").form('clear');
	}
	
	function savePwd(){
		var url = $url('/rest/fmxUserRest/changPassWord.json');
		$('#fmPwd').form('submit', {
	  		contentType : 'application/x-www-form-urlencoded; charset=UTF-8',
	  		url : url,
	  		onSubmit : function() {
	  			return $(this).form('enableValidation').form('validate');
	  		},
	  		success : function(result) {
	  			var data=JSON.parse(result);
	  			if(data.code>=0){
	            	$.messager.show({title:'Tips',msg:'Successful password modification!',timeout:5000,showType:'slide'});
	                $("#dlgChangPwd").data("focus",false).dialog("close");
	        	}else{
	        		var msg = data.message || 'Operation failed!';
					$.messager.alert("Error message", msg,'error');
	        	}
	  		}
		});
	}
</script>
</html>