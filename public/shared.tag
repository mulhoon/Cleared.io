<shared>
	<span>{ App.view.trimmedTitle(App.view.currentItem.text) }</span>
	<div class="face" each={App.view.currentItem.sharers}>
		<img if={picture} src="{ picture }?sz=60"/> 
		<img if={!picture} src="img/default_user.jpg"/>
		{firstname} {lastname}<br/>
		<span class='tag mention'>@{username}</span>
	</div>

	<div class="addshare" onclick={App.view.showShare}>+</div>
</shared>
