<script>
	import Navbar from "./Nav.svelte";
	import Book from "./Book.svelte";
	import AddBook from "./AddBook.svelte";

	let books = [
		{
			read: false,
			author: "andrew johnson",
			pages: 100,
			title: "the river within"
		},
		{
			read: false,
			author: "willes monroe",
			pages: 100,
			title: "out of the house"
		},
		{
			read: true,
			author: "gordom meyer",
			pages: 100,
			title: "gone with the flames"
		},
		{
			read: true,
			author: "harrika sveltsy",
			pages: 100,
			title: "eschatos brides"
		},
		{
			read: true,
			author: "andrews johnson",
			pages: 100,
			title: "no retreat no surrender"
		},
		{
			read: false,
			author: "willes monroet",
			pages: 100,
			title: "desing a neuro network"
		},
		{
			read: false,
			author: "gordomb meyert",
			pages: 100,
			title: "enter the dragon"
		},
		{
			read: false,
			author: "gordomd meyert",
			pages: 100,
			title: "wonderland abyss"
		},
		{
			read: false,
			author: "gordomj meyert",
			pages: 100,
			title: "the scarlet pimpernel"
		}
	];
	const addBuk = e => {
		const newbook = e.detail;
		books = [...books, newbook];
	};
	const removeBook = e => {
		if (confirm("Sure about this!")) {
			books = books.filter(bk => bk.title !== e.detail);
		}
	};
</script>

<style></style>

<Navbar />
<div class="container">
	<div class="row">
		<div class="column column-40 column-offset-50">
			<AddBook on:addbook="{addBuk}" />
		</div>
	</div>
	<div class="row">
		<div class="column">
			{#each books as book} {#if (book.title.length)%2 == 0 }
			<Book
				title="{book.title}"
				pages="{book.pages}"
				author="{book.author}"
				read="{book.read}"
				on:removebook="{removeBook}"
			/>
			{/if} {/each}
		</div>
		<!-- end column a -->
		<div class="column">
			{#each books as book} {#if (book.title.length)%2 == 1 }
			<Book
				title="{book.title}"
				pages="{book.pages}"
				author="{book.author}"
				read="{book.read}"
				on:removebook="{removeBook}"
			/>
			{/if} {/each}
		</div>
		<!-- end column b -->
	</div>
	<!-- end row -->
</div>
<!-- ending container -->
