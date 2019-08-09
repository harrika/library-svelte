

<script>
	import {createEventDispatcher} from 'svelte';
	const dispatch = createEventDispatcher();
	let book = {
		read:false,
		author: "",
		pages: 0,
		title: ""
	};
	const onSubmit =(e)=> {
		e.preventDefault();
		dispatch("addbook", book);
		book = {
			author: "",
			pages: 0,
			title: ""
		};
	};
</script>

<style>	
</style>

	  <div class="column">
	  	<form on:submit={onSubmit}>
	  		<fieldset>
	  		   <label>Add a book to the library</label>
	  		   <input type="text" placeholder="Author" id="authorField"
	  		   bind:value={book.author}>
	  		   <input type="text" placeholder="Title" id="titleField"
	  		   bind:value={book.title}>
	  		   <input type="number" placeholder="Pages" id="pageField"
	  		   bind:value={book.pages}>
	  		   
	  		   <input class="button-outline" type="submit" value="add">
	  		 </fieldset>
	  	</form>
	  </div>

	 

