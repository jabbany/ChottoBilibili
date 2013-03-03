var T = {
	FUNC:0,
	VARI:1,
	NAME:2,
	L_PAREN:3,
	R_PAREN:4
}
function Token(type,text){
	this.type = type;
	this.text = text;
}