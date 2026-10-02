export const scrollToTopEvent='bravite:scroll-to-top';

/** Let the active scroll controller handle the request, with a native fallback. */
export function scrollToPageTop() {
 const request=new Event(scrollToTopEvent,{cancelable:true});
 if(window.dispatchEvent(request))window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
