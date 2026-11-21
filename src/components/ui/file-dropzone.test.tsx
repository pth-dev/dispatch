import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FileDropzone } from './file-dropzone'

function DropzoneHarness({ maxFileMb = 50, disabled = false }: { maxFileMb?: number; disabled?: boolean }) {
  const [files, setFiles] = React.useState<File[]>([])
  return (
    <FileDropzone
      id="test-files"
      files={files}
      onFilesChange={setFiles}
      maxFileMb={maxFileMb}
      disabled={disabled}
    />
  )
}

describe('FileDropzone', () => {
  it('accepts files via drag-and-drop, deduplicates, and allows removing individual files', async () => {
    render(<DropzoneHarness />)

    const dropLabel = screen.getByText(/kéo thả tệp vào đây/i).closest('label')!
    const fileA = new File(['hello'], 'spec.pdf', { type: 'application/pdf', lastModified: 1000 })
    const fileB = new File(['world'], 'image.png', { type: 'image/png', lastModified: 2000 })

    fireEvent.dragEnter(dropLabel, { dataTransfer: { files: [fileA] } })
    fireEvent.drop(dropLabel, { dataTransfer: { files: [fileA, fileB] } })
    // Dropping the same file again should not duplicate it
    fireEvent.drop(dropLabel, { dataTransfer: { files: [fileA] } })

    expect(screen.getAllByText('spec.pdf')).toHaveLength(1)
    expect(screen.getByText('image.png')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /xoá tệp spec\.pdf/i }))
    expect(screen.queryByText('spec.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('image.png')).toBeInTheDocument()
  })

  it('supports clicking/uploading via hidden file input', async () => {
    const user = userEvent.setup()
    render(<DropzoneHarness />)

    const input = document.getElementById('test-files') as HTMLInputElement
    const file = new File(['abc'], 'notes.txt', { type: 'text/plain' })
    await user.upload(input, file)

    expect(screen.getByText('notes.txt')).toBeInTheDocument()
  })

  it('rejects oversized files and interpolates maxFileMb in localized error', () => {
    render(<DropzoneHarness maxFileMb={1} />)

    const dropLabel = screen.getByText(/kéo thả tệp vào đây/i).closest('label')!
    const bigFile = new File([new Uint8Array(2 * 1024 * 1024)], 'huge.zip', {
      type: 'application/zip',
    })

    fireEvent.drop(dropLabel, { dataTransfer: { files: [bigFile] } })

    expect(screen.getByRole('alert')).toHaveTextContent(/1 MB/i)
    expect(screen.queryByText('huge.zip')).not.toBeInTheDocument()
  })
})
