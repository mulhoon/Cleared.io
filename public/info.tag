<info>
    <header>
        <div class="close cross" onclick={App.view.hideInfo}></div>
        <div class='title'>{ App.view.trimmedTitle(App.view.currentItem.text) }</div>
    </header>
    <div class='middle'>
		<div if={App.view.currentItem}>
			Updated: { moment(App.view.currentItem.date).format("MMM,Do HH:mm:ss") }<br/>
			Words: { App.view.currentItem.text.split(" ").length }<br/>
		
			<h2>Sharing:</h2>
			<div class="face" each={App.view.currentItem.sharers}>
				<img if={picture} src="{ picture }?sz=60"/> 
				<img if={!picture} src="img/default_user.jpg"/>
				{firstname} {lastname}<br/>
				<span class='tag mention'>@{username}</span>
			</div>
		</div>
		<div class="addshare" onclick={App.view.showShare}>+</div>
	</div>


</info>
