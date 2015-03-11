<files>
	<div class="file { active: active } { shared:Object.size(users)>1 }" data-id={ key } each={ App.view.items } onclick={ App.view.open } >
		<span>{ App.view.trimmedTitle(text) }</span>
		<div if={active} class="info" onclick={ App.view.info }></div>
	</div>
</files>
