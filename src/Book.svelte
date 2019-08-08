

<script>
	import {createEventDispatcher} from 'svelte';
	const dispatch = createEventDispatcher();

	export let author;
	export let title;
	export let pages;
	export let read;
	const delbook =()=>dispatch("removebook", title);
	const togstat = () => sendtogstat;
</script>

<style>	
	.card {
	  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
	  transition: 0.3s;
	  /*width: 70%;*/
	  padding: 25px;
	  margin: 10px 5px;
	  color: #204f6e;
	}
	.card:hover {
	  box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
	}
	.button-small {
	  /*font-size: .8rem;*/
	  height: 2.8rem;
	  line-height: 2.8rem;
	  padding: 0 1.5rem;
	  margin-top: 5px;
	}
</style>

	  <div class="column">
	  	<div class="card">
	  		<strong>{title}</strong> <br>
	  		<strong>{pages} pages</strong>	
	  		by {author} 
	  		<button class="button button-clear button-small" on:click={togstat}>
	  		{#if read }	read{:else}	not read{/if}
	  		</button>
	  		<button class="button button-outline button-small" on:click={delbook}>del</button>
	  	</div>	  	
	  </div>

	 

