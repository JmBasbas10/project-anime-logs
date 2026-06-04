import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ player_id: string }>
}

// Reuse the [username] page — pass the numeric ID as the param
export default async function PlayerByIdPage({ params }: Props) {
  const { player_id } = await params
  redirect(`/players/${player_id}`)
}
