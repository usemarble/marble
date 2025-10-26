import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

type ResetPasswordProps = {
	userEmail: string;
	resetLink: string;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const ResetPasswordEmail = ({
	userEmail,
	resetLink,
}: ResetPasswordProps) => {
	return (
		<Html>
			<Head />
			<Preview>Reset your password</Preview>
			<Tailwind>
				<Body className="mx-auto my-auto bg-white px-2 font-sans">
					<Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
						<Section className="mt-[32px]">
							<Img
								alt="logo"
								className="mx-auto my-0"
								height="37"
								src={`${baseUrl}/icon.png`}
								width="40"
							/>
						</Section>
						<Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
							Reset your password
						</Heading>
						<Text className="text-[14px] text-black leading-[24px]">
							Forgot your password? We received a request to reset the password
							for your account. To reset your password, click on the button
							below:
						</Text>
						<Button href={resetLink}>Reset your password</Button>
						<Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This email was intended for{" "}
							<span className="text-black">{userEmail}</span>. If you did not
							request this code, you can ignore this email. If you are concerned
							about your account's safety, please send an email to
							support@marblecms.com to get in touch with us.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
