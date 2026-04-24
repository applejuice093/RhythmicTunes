function FavoriteButton({
  isLiked,
  isLoading = false,
  onClick,
  className = '',
  style,
}) {
  return (
    <button
      type="button"
      aria-label={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
      aria-pressed={isLiked}
      disabled={isLoading}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick?.()
      }}
      className={`grid place-items-center rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      style={style}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s-6.72-4.35-9.33-8.08C.79 10.24 1.4 6.2 4.72 4.61c2.14-1.02 4.66-.51 6.28 1.27 1.62-1.78 4.14-2.29 6.28-1.27 3.32 1.59 3.93 5.63 2.05 8.31C18.72 16.65 12 21 12 21z" />
      </svg>
    </button>
  )
}

export default FavoriteButton
