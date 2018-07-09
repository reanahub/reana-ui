import React from 'react';
import Header from 'grommet/components/Header';
import Title from 'grommet/components/Title';
import Box from 'grommet/components/Box';
import Menu from 'grommet/components/Menu';
import Anchor from 'grommet/components/Anchor';
import Actions from 'grommet/components/icons/base/Actions';


function Head() {
	return (
		<Header size='medium'>
			<Title>
				Reana
			</Title>
			<Box flex={true}
			     justify='end'
			     direction='row'
			     responsive={true}>
				<Menu icon={<Actions />}
				      dropAlign={{"right": "right"}}>
					<Anchor href='#'
					        className='active'>
						First
					</Anchor>
					<Anchor href='#'>
						Second
					</Anchor>
					<Anchor href='#'>
						Third
					</Anchor>
				</Menu>
			</Box>
		</Header>
	);
}

export default Head;
