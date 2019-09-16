$(function() {
	function xor(password) {
		var xor_key = new Date().getMilliseconds();
		var result = [];
		for (i = 0; i < password.length; ++i) {
			result.push(String.fromCharCode(xor_key ^ password.charCodeAt(i)));
		}
		if(window['Base64']){
			result = Base64.encode(result.join(''));
			xor_key = 'x64:'+xor_key;
		}else{
			result = result.join('');
		}
		return {
			password : result,
			key : xor_key
		}
	}
	function $getParam(name) {
		var result = null, tmp = [], search = location.search;
		if (!search || search.length < 1)
			return result;
		var items = location.search.substr(1).split("&");
		for (var index = 0; index < items.length; index++) {
			tmp = items[index].split("=");
			if (tmp[0] === name)
				result = decodeURIComponent(tmp[1]);
		}
		return result;
	}
	var $codeimg = $("#code img"), $form = $("#loginForm");
	$('#but_login').click(function(e) {
		submit();
	});
	$(document).keydown(function(e) {
		if (e.keyCode == 13) {
			submit();
		}
	});
	function submit() {
		var submit = true;
		var input = $form.find('input:focus');
		input.triggerHandler('blur');
		input.focus();
		$form.find("input[nullmsg]").each(function() {
			var el = $(this);
			if (el.val() == "") {
				showError(el.attr("nullmsg"));
				submit = false;
				el.focus();
				return false;
			}
		});
		if (submit) {
			Login();
		}

	}
	function Login() {
		var formData = {};
		$form.find("input[name]").each(function() {
			formData[this.name] = this.value;
		});
		var password = $("#password",$form).val();
		var pw = xor(password);
		formData["password"] = pw.password;
		formData["key"] = pw.key;
		$("#txtPwd",$form).val(pw.password);
		$("#txtKey",$form).val(pw.key);		
		function checkCode() {
			var url = $codeimg.attr('checkurl'), $checkCode = $('#checkCode');
			$.ajax({
				async : false,
				cache : false,
				type : 'POST',
				url : url,
				data : "code=" + $checkCode.val(),
				error : function() {
				},
				success : function(data) {
					if (data && (data == '1' || data == 1)) {
						checkUser();
					} else {
						showError($checkCode.attr('errmsg'));
						$codeimg.triggerHandler("click");
					}
				}
			});
		}
		function checkUser() {
			var url = $form.attr('checkurl');
			$.ajax({
				async : false,
				cache : false,
				type : 'POST',
				url : url,
				dataType : 'JSON',
				data : formData,
				error : function() {
				},
				success : function(data) {
					if (data.code != 0 && data.message) {
						showError(data.message);
					} else if (data.code == 0 && data.data == 1) {
						$form.submit();
					} else if (data.data == -2) {
						showError(('用户当前状态为锁定状态，不允许登录！'));
					} else {
						showError($form.attr('errmsg'));
					}
				}
			});
		}
		if ($codeimg.size() > 0) {
			checkCode();
		} else{
			checkUser();
		}
	}
	function showError(str) {
		$(".warning").css('visibility', '').html(str);
		// $("form input[name=username]").focus();
	}
	$codeimg.click(function() {
		var src = this.src, idx = src.indexOf('?');
		if (idx > -1) {
			src = src.substring(0, idx);
		}
		this.src = src + '?seed=' + Math.random();
	});
	$("#loginForm").find('input:first').focus();
	// 显示错误信息
	var code = $getParam('code');
	var msg = $getParam('message');
	if (code == '-10') {
		showError('密码错误!');
	} else if (code == '-11') {
		showError('用户不存在');
	} else if (code == '-12') {
		showError('用户被锁定');
	} else if (code == '-13') {
		showError('用户被禁用');
	} else if (code == '-14') {
		showError('账号已过期');
	} else if (code == '-15') {
		showError('密码已过期');
	} else if (code == '-16') {
		showError(msg || '系统内部异常！');
	}
});